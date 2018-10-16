// External libraries
import * as chai from "chai";
import * as Web3 from "web3";
import * as ABIDecoder from "abi-decoder";
import * as _ from "lodash";
// Types
import { DebtOrderFixtures } from "./fixtures/DebtOrders";
import { DebtOrder } from "../../types/DebtOrder";
// Artifacts
import * as addressBook from "dharma-address-book";
import SnapshotManager from "./helpers/SnapshotManager";

// Artifacts
const NaiveCreditorProxy = artifacts.require("./NaiveCreditorProxy.sol");
const TokenRegistry = artifacts.require("./TokenRegistry.sol");
const DummyToken = artifacts.require("./DummyToken.sol");
const DebtKernel = artifacts.require("./DebtKernelInterface.sol");

const addresses = addressBook.latest.development;

// Configuration
const expect = chai.expect;

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const proxy = new web3.eth.Contract(NaiveCreditorProxy.abi, NaiveCreditorProxy.address);
const registry = new web3.eth.Contract(TokenRegistry.abi, addresses.TokenRegistry);

const snapshotManager = new SnapshotManager(web3);

const MAX_GAS = 6712390;

let debtOrderFixtures: DebtOrderFixtures;

let principalTokenAddress: string;
let collateralTokenAddress: string;

// DummyToken types - not yet defined.
let principalToken: any;
let collateralToken: any;

let creditor: string;
let debtor: string;

contract("NaiveCreditorProxy", (accounts) => {
    describe.only("implementation", () => {
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
                NaiveCreditorProxy.address,
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
            describe("when given a valid order", () => {
                it("returns the expected bytes32 hash", async () => {
                    const validOrder = await debtOrderFixtures.signedOrder();
                    const expected = debtOrderFixtures.creditorHashForOrder(validOrder);

                    const result = await proxy.methods.hashCreditorCommitmentForOrder(
                        validOrder,
                    ).call();

                    expect(result).to.eq(expected);
                });
            });
        });

        describe("#fillDebtOffer", () => {
            let snapshotId: number;

            before(async () => {
                ABIDecoder.addABI(DebtKernel.abi);

                snapshotId = await snapshotManager.saveTestSnapshot();
            });

            after(async () => {
                ABIDecoder.removeABI(DebtKernel.abi);

                await snapshotManager.revertToSnapshot(snapshotId);
            });

            describe("when given an unsigned debt offer", () => {
                let commitmentHash: string;
                let unsignedOrder: DebtOrder;

                before(async () => {
                    unsignedOrder = await debtOrderFixtures.unsignedOrder();

                    commitmentHash = await proxy.methods.hashCreditorCommitmentForOrder(
                        unsignedOrder,
                    ).call();
                });

                it("returns a transactionReceipt", async () => {
                    const txReceipt = await proxy.methods.fillDebtOffer(unsignedOrder).send(
                        { from: unsignedOrder.creditor, gas: MAX_GAS },
                    );

                    const txHash = txReceipt.transactionHash;

                    expect(txHash).to.be.a("string");
                });

                it("does not add a mapping in the debtOfferFilled field", async () => {
                    const result = await proxy.methods.debtOfferFilled(commitmentHash).call();

                    expect(result).to.eq(false);
                });
            });

            describe("when given a signed debt order", () => {
                let signedOrder: DebtOrder;
                let commitmentHash: string;
                let txReceipt: any;

                before(async () => {
                    signedOrder = await debtOrderFixtures.signedOrder();

                    commitmentHash = await proxy.methods.hashCreditorCommitmentForOrder(
                        signedOrder,
                    ).call();
                });

                it("returns a transaction receipt", async () => {
                    txReceipt = await proxy.methods.fillDebtOffer(signedOrder).send(
                        { from: signedOrder.creditor, gas: MAX_GAS },
                    );

                    const txHash = txReceipt.transactionHash;

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

        describe("when no order has been filled", () => {
            describe("#debtOfferFilled", () => {
                it("returns false for some given bytes32 argument", async () => {
                    const bytes32String = web3.utils.fromAscii("test");
                    const result = await proxy.methods.debtOfferFilled(bytes32String).call();

                    expect(result).to.eq(false);
                });
            });

            describe("#cancelDebtOffer", () => {
                let txReceipt;

                it("returns a transaction receipt", async () => {
                    const signedOrder = await debtOrderFixtures.signedOrder();

                    txReceipt = await proxy.methods.cancelDebtOffer(signedOrder).send(
                        { from: accounts[0] }
                    );

                    const txHash = txReceipt.transactionHash;
                    // The transaction receipt is valid if it has a string transaction hash.
                    expect(txHash).to.be.a("string");
                });
            });
        });
    });
});
