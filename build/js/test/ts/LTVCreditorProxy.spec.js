"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// External libraries
const chai = require("chai");
const Web3 = require("web3");
const ABIDecoder = require("abi-decoder");
const _ = require("lodash");
// Types
const DebtOrders_1 = require("./fixtures/DebtOrders");
const LTVFixtures_1 = require("./fixtures/LTVFixtures");
const addressBook = require("dharma-address-book");
const SnapshotManager_1 = require("./helpers/SnapshotManager");
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
const snapshotManager = new SnapshotManager_1.default(web3);
let debtOrderFixtures;
let lTVFixtures;
let principalTokenAddress;
let collateralTokenAddress;
// DummyToken types - not yet defined.
let principalToken;
let collateralToken;
let creditor;
let debtor;
contract("LTVCreditorProxy", (accounts) => {
    describe("implementation", () => {
        before(() => __awaiter(this, void 0, void 0, function* () {
            // To keep things simple, they're just the same for now.
            creditor = accounts[0];
            debtor = accounts[0];
            yield setupBalancesAndAllowances();
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
            debtOrderFixtures = new DebtOrders_1.DebtOrderFixtures(web3, accounts, tokens, participants, contracts);
            lTVFixtures = new LTVFixtures_1.LTVFixtures(web3, accounts, tokens, participants, contracts);
        }));
        const setupBalancesAndAllowances = () => __awaiter(this, void 0, void 0, function* () {
            principalTokenAddress = yield registry.methods.getTokenAddressByIndex(0).call();
            collateralTokenAddress = yield registry.methods.getTokenAddressByIndex(1).call();
            principalToken = new web3.eth.Contract(DummyToken.abi, principalTokenAddress);
            collateralToken = new web3.eth.Contract(DummyToken.abi, collateralTokenAddress);
            yield principalToken.methods.setBalance(creditor, 1000000000000).send({ from: creditor });
            yield principalToken.methods.approve(LTVCreditorProxy.address, 1000000000000).send({ from: creditor });
            yield collateralToken.methods.setBalance(debtor, 100000000).send({ from: creditor });
            yield collateralToken.methods.approve(addresses.TokenTransferProxy, 100000000).send({ from: debtor });
        });
        describe("#hashCreditorCommitmentForOrder", () => {
            describe("when given commitment values and a debt order", () => {
                it("returns the expected bytes32 hash", () => __awaiter(this, void 0, void 0, function* () {
                    const params = yield lTVFixtures.unsignedParams();
                    const order = yield debtOrderFixtures.unsignedOrder();
                    const commitmentValues = params.creditorCommitment.values;
                    const expected = yield lTVFixtures.commitmentHash(commitmentValues, order);
                    const result = yield proxy.methods.hashCreditorCommitmentForOrder(commitmentValues, order).call();
                    expect(result).to.eq(expected);
                }));
            });
        });
        describe("when given params that are signed by the creditor but not the price feed operator", () => {
            // STUB.
        });
        describe("#fillDebtOffer", () => {
            let snapshotId;
            before(() => __awaiter(this, void 0, void 0, function* () {
                ABIDecoder.addABI(DebtKernel.abi);
                ABIDecoder.addABI(LTVCreditorProxy.abi);
                snapshotId = yield snapshotManager.saveTestSnapshot();
            }));
            after(() => __awaiter(this, void 0, void 0, function* () {
                ABIDecoder.removeABI(DebtKernel.abi);
                ABIDecoder.removeABI(LTVCreditorProxy.abi);
                yield snapshotManager.revertToSnapshot(snapshotId);
            }));
            describe("when given unsigned parameters", () => {
                let unsignedOrder;
                let commitmentHash;
                before(() => __awaiter(this, void 0, void 0, function* () {
                    const params = yield lTVFixtures.unsignedParams();
                    unsignedOrder = params.order;
                    commitmentHash = yield proxy.methods.hashCreditorCommitmentForOrder(params.creditorCommitment.values, unsignedOrder).call();
                }));
                it("returns a transaction receipt", () => __awaiter(this, void 0, void 0, function* () {
                    const values = { maxLTV: 100 };
                    const creditorCommitment = {
                        values,
                        signature: debtOrderFixtures.blankSignature
                    };
                    const principalPrice = {
                        value: 0,
                        tokenAddress: principalTokenAddress,
                        timestamp: 0,
                        signature: debtOrderFixtures.blankSignature
                    };
                    const collateralPrice = {
                        value: 0,
                        tokenAddress: collateralTokenAddress,
                        timestamp: 0,
                        signature: debtOrderFixtures.blankSignature
                    };
                    const params = {
                        creditorCommitment,
                        creditor: accounts[0],
                        priceFeedOperator: accounts[1],
                        principalPrice,
                        collateralPrice,
                        order: unsignedOrder
                    };
                    const transactionReceipt = yield proxy.methods.fillDebtOffer(params).send({
                        from: unsignedOrder.creditor
                    });
                    expect(transactionReceipt.transactionHash).to.be.a("string");
                }));
                it("does not add a mapping in the debtOfferFilled field", () => __awaiter(this, void 0, void 0, function* () {
                    const result = yield proxy.methods.debtOfferFilled(commitmentHash).call();
                    expect(result).to.eq(false);
                }));
            });
            describe("when given params valid signed params", () => {
                let order;
                let commitmentHash;
                let params;
                let txReceipt;
                before(() => __awaiter(this, void 0, void 0, function* () {
                    params = yield lTVFixtures.signedParams();
                    order = params.order;
                    commitmentHash = yield proxy.methods.hashCreditorCommitmentForOrder(params.creditorCommitment.values, order).call();
                }));
                it("returns a transaction receipt", () => __awaiter(this, void 0, void 0, function* () {
                    txReceipt = yield proxy.methods.fillDebtOffer(params).send({
                        from: params.creditor,
                        gas: 6712390
                    });
                    const txHash = txReceipt.transactionHash;
                    // The transaction receipt is valid if it has a string transaction hash.
                    expect(txHash).to.be.a("string");
                }));
                it("adds a mapping in the debtOfferFilled field", () => __awaiter(this, void 0, void 0, function* () {
                    const result = yield proxy.methods.debtOfferFilled(commitmentHash).call();
                    expect(result).to.eq(true);
                }));
                it("emits a 'LogDebtOrderFilled' event from the DebtKernel", () => __awaiter(this, void 0, void 0, function* () {
                    const receipt = yield web3.eth.getTransactionReceipt(txReceipt.transactionHash);
                    const logs = _.compact(ABIDecoder.decodeLogs(receipt.logs));
                    const successLog = logs[0];
                    expect(successLog.name).to.eq("LogDebtOrderFilled");
                    expect(successLog.address.toUpperCase()).to.eq(addresses.DebtKernel.toUpperCase());
                }));
            });
        });
    });
});
//# sourceMappingURL=LTVCreditorProxy.spec.js.map