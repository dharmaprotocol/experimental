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
// Artifacts
const addressBook = require("dharma-address-book");
const SnapshotManager_1 = require("./helpers/SnapshotManager");
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
const snapshotManager = new SnapshotManager_1.default(web3);
const MAX_GAS = 6712390;
let debtOrderFixtures;
let principalTokenAddress;
let collateralTokenAddress;
// DummyToken types - not yet defined.
let principalToken;
let collateralToken;
let creditor;
let debtor;
contract("NaiveCreditorProxy", (accounts) => {
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
        }));
        const setupBalancesAndAllowances = () => __awaiter(this, void 0, void 0, function* () {
            principalTokenAddress = yield registry.methods.getTokenAddressByIndex(0).call();
            collateralTokenAddress = yield registry.methods.getTokenAddressByIndex(1).call();
            principalToken = new web3.eth.Contract(DummyToken.abi, principalTokenAddress);
            collateralToken = new web3.eth.Contract(DummyToken.abi, collateralTokenAddress);
            yield principalToken.methods.setBalance(creditor, 1000000000000).send({ from: creditor });
            yield principalToken.methods.approve(NaiveCreditorProxy.address, 1000000000000).send({ from: creditor });
            yield collateralToken.methods.setBalance(debtor, 100000000).send({ from: creditor });
            yield collateralToken.methods.approve(addresses.TokenTransferProxy, 100000000).send({ from: debtor });
        });
        describe("#hashCreditorCommitmentForOrder", () => {
            describe("when given a valid order", () => {
                it("returns the expected bytes32 hash", () => __awaiter(this, void 0, void 0, function* () {
                    const validOrder = yield debtOrderFixtures.signedOrder();
                    const expected = debtOrderFixtures.creditorHashForOrder(validOrder);
                    const result = yield proxy.methods.hashCreditorCommitmentForOrder(validOrder).call();
                    expect(result).to.eq(expected);
                }));
            });
        });
        describe("#fillDebtOffer", () => {
            let snapshotId;
            before(() => __awaiter(this, void 0, void 0, function* () {
                ABIDecoder.addABI(DebtKernel.abi);
                snapshotId = yield snapshotManager.saveTestSnapshot();
            }));
            after(() => __awaiter(this, void 0, void 0, function* () {
                ABIDecoder.removeABI(DebtKernel.abi);
                yield snapshotManager.revertToSnapshot(snapshotId);
            }));
            describe("when given an unsigned debt offer", () => {
                let commitmentHash;
                let unsignedOrder;
                before(() => __awaiter(this, void 0, void 0, function* () {
                    unsignedOrder = yield debtOrderFixtures.unsignedOrder();
                    commitmentHash = yield proxy.methods.hashCreditorCommitmentForOrder(unsignedOrder).call();
                }));
                it("returns a transactionReceipt", () => __awaiter(this, void 0, void 0, function* () {
                    const txReceipt = yield proxy.methods.fillDebtOffer(unsignedOrder).send({ from: unsignedOrder.creditor, gas: MAX_GAS });
                    const txHash = txReceipt.transactionHash;
                    expect(txHash).to.be.a("string");
                }));
                it("does not add a mapping in the debtOfferFilled field", () => __awaiter(this, void 0, void 0, function* () {
                    const result = yield proxy.methods.debtOfferFilled(commitmentHash).call();
                    expect(result).to.eq(false);
                }));
            });
            describe("when given a signed debt order", () => {
                let signedOrder;
                let commitmentHash;
                let txReceipt;
                before(() => __awaiter(this, void 0, void 0, function* () {
                    signedOrder = yield debtOrderFixtures.signedOrder();
                    commitmentHash = yield proxy.methods.hashCreditorCommitmentForOrder(signedOrder).call();
                }));
                it("returns a transaction receipt", () => __awaiter(this, void 0, void 0, function* () {
                    txReceipt = yield proxy.methods.fillDebtOffer(signedOrder).send({ from: signedOrder.creditor, gas: MAX_GAS });
                    const txHash = txReceipt.transactionHash;
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
        describe("when no order has been filled", () => {
            describe("#debtOfferFilled", () => {
                it("returns false for some given bytes32 argument", () => __awaiter(this, void 0, void 0, function* () {
                    const bytes32String = web3.utils.fromAscii("test");
                    const result = yield proxy.methods.debtOfferFilled(bytes32String).call();
                    expect(result).to.eq(false);
                }));
            });
            describe("#cancelDebtOffer", () => {
                let txReceipt;
                it("returns a transaction receipt", () => __awaiter(this, void 0, void 0, function* () {
                    const signedOrder = yield debtOrderFixtures.signedOrder();
                    txReceipt = yield proxy.methods.cancelDebtOffer(signedOrder).send({ from: accounts[0] });
                    const txHash = txReceipt.transactionHash;
                    // The transaction receipt is valid if it has a string transaction hash.
                    expect(txHash).to.be.a("string");
                }));
            });
        });
    });
});
//# sourceMappingURL=NaiveCreditorProxy.spec.js.map