// External libraries
import * as chai from "chai";
import * as Web3 from "web3";
import * as ABIDecoder from "abi-decoder";
import * as _ from "lodash";

// Types
import { DebtOrderFixtures } from "./fixtures/DebtOrders";
import { CommitmentValues, CreditorCommitment, LTVParams, Price } from "../../types/LTVTypes";
import { DebtOrder } from "../../types/DebtOrder";
import { LTVFixtures } from "./fixtures/LTVFixtures";

import * as addressBook from "dharma-address-book";
import SnapshotManager from "./helpers/SnapshotManager";

// Artifacts
const LTVCreditorProxy = artifacts.require("./LTVCreditorProxy.sol");
const TokenRegistry = artifacts.require("./TokenRegistry.sol");
const DummyToken = artifacts.require("./DummyToken.sol");
const DebtKernel = artifacts.require("./DebtKernelInterface.sol");

const addresses = addressBook.latest.development;

// Configuration
const expect = chai.expect;

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const proxy = new web3.eth.Contract(LTVCreditorProxy.abi, LTVCreditorProxy.address);
const registry = new web3.eth.Contract(TokenRegistry.abi, addresses.TokenRegistry);

const snapshotManager = new SnapshotManager(web3);

let debtOrderFixtures: DebtOrderFixtures;
let lTVFixtures: LTVFixtures;

let principalTokenAddress: string;
let collateralTokenAddress: string;

// DummyToken types - not yet defined.
let principalToken: any;
let collateralToken: any;

let creditor: string;
let debtor: string;

contract("LTVCreditorProxy", (accounts) => {
    describe("implementation", () => {
        before(async () => {
            // To keep things simple, they're just the same for now.
            creditor = accounts[0];
            debtor = accounts[0];

            await setupBalancesAndAllowances();

            const tokens = {
                principalAddress: principalTokenAddress,
                collateralAddress: collateralTokenAddress,
            };

            const participants = {
                creditor,
                debtor,
            };

            const contracts = {
                debtKernelAddress: addresses.DebtKernel,
                repaymentRouterAddress: addresses.RepaymentRouter,
                termsContractAddress: addresses.CollateralizedSimpleInterestTermsContract,
            };

            debtOrderFixtures = new DebtOrderFixtures(web3, accounts, tokens, participants, contracts);
            lTVFixtures = new LTVFixtures(web3, accounts, tokens, participants, contracts);
        });

        const setupBalancesAndAllowances = async (): Promise<void> => {
            principalTokenAddress = await registry.methods.getTokenAddressByIndex(0).call();
            collateralTokenAddress = await registry.methods.getTokenAddressByIndex(1).call();

            principalToken = new web3.eth.Contract(DummyToken.abi, principalTokenAddress);
            collateralToken = new web3.eth.Contract(DummyToken.abi, collateralTokenAddress);

            await principalToken.methods.setBalance(
                creditor,
                1000000000000,
            ).send({ from: creditor });

            await principalToken.methods.approve(
                LTVCreditorProxy.address,
                1000000000000,
            ).send({ from: creditor });

            await collateralToken.methods.setBalance(
                debtor,
                100000000,
            ).send({ from: creditor });

            await collateralToken.methods.approve(
                addresses.TokenTransferProxy,
                100000000,
            ).send({ from: debtor });
        };

        describe("#hashCreditorCommitmentForOrder", () => {
            describe("when given commitment values and a debt order", () => {
                it("returns the expected bytes32 hash", async () => {
                    const params = await lTVFixtures.unsignedParams();
                    const order = await debtOrderFixtures.unsignedOrder();
                    const commitmentValues = params.creditorCommitment.values;

                    const expected = await lTVFixtures.commitmentHash(commitmentValues, order);

                    const result = await proxy.methods.hashCreditorCommitmentForOrder(
                        commitmentValues,
                        order,
                    ).call();

                    expect(result).to.eq(expected);
                });
            });
        });

        describe("when given params that are signed by the creditor but not the price feed operator", () => {
            // STUB.
        });

        describe("#fillDebtOffer", () => {
            let snapshotId: number;

            before(async () => {
                ABIDecoder.addABI(DebtKernel.abi);
                ABIDecoder.addABI(LTVCreditorProxy.abi);

                snapshotId = await snapshotManager.saveTestSnapshot();
            });

            after(async () => {
                ABIDecoder.removeABI(DebtKernel.abi);
                ABIDecoder.removeABI(LTVCreditorProxy.abi);

                await snapshotManager.revertToSnapshot(snapshotId);
            });

            describe("when given unsigned parameters", () => {
                let unsignedOrder: DebtOrder;
                let commitmentHash: string;

                before(async () => {
                    const params = await lTVFixtures.unsignedParams();

                    unsignedOrder = params.order;

                    commitmentHash = await proxy.methods.hashCreditorCommitmentForOrder(
                        params.creditorCommitment.values,
                        unsignedOrder
                    ).call();
                });

                it("returns a transaction receipt", async () => {
                    const values: CommitmentValues = { maxLTV: 100 };

                    const creditorCommitment: CreditorCommitment = {
                        values,
                        signature: debtOrderFixtures.blankSignature
                    };

                    const principalPrice: Price = {
                        value: 0,
                        tokenAddress: principalTokenAddress,
                        timestamp: 0,
                        signature: debtOrderFixtures.blankSignature
                    };

                    const collateralPrice: Price = {
                        value: 0,
                        tokenAddress: collateralTokenAddress,
                        timestamp: 0,
                        signature: debtOrderFixtures.blankSignature
                    };

                    const params: LTVParams = {
                        creditorCommitment,
                        creditor: accounts[0],
                        priceFeedOperator: accounts[1],
                        principalPrice,
                        collateralPrice,
                        order: unsignedOrder
                    };

                    const transactionReceipt = await proxy.methods.fillDebtOffer(params).send({
                        from: unsignedOrder.creditor
                    });

                    expect(transactionReceipt.transactionHash).to.be.a("string");
                });

                it("does not add a mapping in the debtOfferFilled field", async () => {
                    const result = await proxy.methods.debtOfferFilled(commitmentHash).call();

                    expect(result).to.eq(false);
                });
            });

            describe("when given params valid signed params", () => {
                let order: DebtOrder;
                let commitmentHash: string;
                let params: LTVParams;
                let txReceipt: any;

                before(async () => {
                    params = await lTVFixtures.signedParams();
                    order = params.order;

                    commitmentHash = await proxy.methods.hashCreditorCommitmentForOrder(
                        params.creditorCommitment.values,
                        order,
                    ).call();
                });

                it("returns a transaction receipt", async () => {
                    txReceipt = await proxy.methods.fillDebtOffer(params).send({
                        from: params.creditor,
                        gas: 6712390
                    });

                    const txHash = txReceipt.transactionHash;

                    // The transaction receipt is valid if it has a string transaction hash.
                    expect(txHash).to.be.a("string");
                });

                it("adds a mapping in the debtOfferFilled field", async () => {
                    const result = await proxy.methods.debtOfferFilled(commitmentHash).call();

                    expect(result).to.eq(true);
                });

                it("emits a 'LogDebtOrderFilled' event from the DebtKernel", async () => {
                    const receipt = await web3.eth.getTransactionReceipt(txReceipt.transactionHash);
                    const logs = _.compact(ABIDecoder.decodeLogs(receipt.logs));

                    const successLog = logs[0];

                    expect(successLog.name).to.eq("LogDebtOrderFilled");
                    expect(successLog.address.toUpperCase()).to.eq(
                        addresses.DebtKernel.toUpperCase(),
                    );
                });
            });
        });
    });
});
