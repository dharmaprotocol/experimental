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
// External Libraries
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
const addressBook = require("dharma-address-book");
const bignumber_js_1 = require("bignumber.js");
// Artifacts
const LTVCreditorProxy = artifacts.require("./lTVCreditorProxy.sol");
const TokenRegistry = artifacts.require("./TokenRegistry.sol");
const DummyToken = artifacts.require("./DummyToken.sol");
const ECDSASignature_1 = require("../../../../../types/ECDSASignature");
const types_1 = require("../../../../../typescript/types");
// Utils
const SnapshotManager_1 = require("../../../../ts/helpers/SnapshotManager");
const ltvCreditorProxyAddress = artifacts.require("./LTVCreditorProxy.sol").address;
// Configuration
chai.use(chaiAsPromised);
const expect = chai.expect;
const addresses = addressBook.latest.development;
function generateSignedPrice(web3, priceProviderAddress, value, tokenAddress, timestamp) {
    return __awaiter(this, void 0, void 0, function* () {
        const priceHash = web3.utils.soliditySha3(value, tokenAddress, timestamp);
        const signature = yield ECDSASignature_1.ecSign(web3, priceHash, priceProviderAddress);
        return { value, tokenAddress, timestamp, signature };
    });
}
function testAcceptAsDebtor(web3, params) {
    return __awaiter(this, void 0, void 0, function* () {
        const snapshotManager = new SnapshotManager_1.default(web3);
        const tokenRegistry = new web3.eth.Contract(TokenRegistry.abi, addresses.TokenRegistry);
        describe("passing valid params", () => {
            const priceProvider = params.priceProvider;
            let creditor;
            let debtor;
            let loanOffer;
            let snapshotId;
            function setPrices() {
                return __awaiter(this, void 0, void 0, function* () {
                    const principalTokenAddress = yield tokenRegistry.methods
                        .getTokenAddressBySymbol(params.principalToken)
                        .call();
                    const collateralTokenAddress = yield tokenRegistry.methods
                        .getTokenAddressBySymbol(params.collateralToken)
                        .call();
                    const principalPrice = yield generateSignedPrice(web3, priceProvider, 10, principalTokenAddress, Math.round(Date.now() / 1000));
                    const collateralPrice = yield generateSignedPrice(web3, priceProvider, 10, collateralTokenAddress, Math.round(Date.now() / 1000));
                    loanOffer.setPrincipalPrice(principalPrice);
                    loanOffer.setCollateralPrice(collateralPrice);
                });
            }
            const setupBalancesAndAllowances = () => __awaiter(this, void 0, void 0, function* () {
                const principalTokenAddress = yield tokenRegistry.methods
                    .getTokenAddressBySymbol(params.principalToken)
                    .call();
                const collateralTokenAddress = yield tokenRegistry.methods
                    .getTokenAddressBySymbol(params.collateralToken)
                    .call();
                const principalToken = new web3.eth.Contract(DummyToken.abi, principalTokenAddress);
                const collateralToken = new web3.eth.Contract(DummyToken.abi, collateralTokenAddress);
                yield principalToken.methods
                    .setBalance(creditor, new bignumber_js_1.default(10000000000000000000000).toString())
                    .send({ from: creditor });
                yield principalToken.methods
                    .approve(LTVCreditorProxy.address, new bignumber_js_1.default(10000000000000000000000).toString())
                    .send({ from: creditor });
                yield collateralToken.methods
                    .setBalance(debtor, new bignumber_js_1.default(10000000000000000000000).toString())
                    .send({ from: creditor });
                yield collateralToken.methods
                    .approve(addresses.TokenTransferProxy, new bignumber_js_1.default(10000000000000000000000).toString())
                    .send({ from: debtor });
            });
            before(() => __awaiter(this, void 0, void 0, function* () {
                snapshotId = yield snapshotManager.saveTestSnapshot();
            }));
            after(() => __awaiter(this, void 0, void 0, function* () {
                yield snapshotManager.revertToSnapshot(snapshotId);
            }));
            beforeEach(() => __awaiter(this, void 0, void 0, function* () {
                const accounts = yield web3.eth.getAccounts();
                creditor = accounts[0];
                debtor = accounts[1];
                yield setupBalancesAndAllowances();
                loanOffer = yield types_1.MaxLTVLoanOffer.create(ltvCreditorProxyAddress, web3, params);
            }));
            it("accepts the offer as the debtor if all prerequisites are met", () => __awaiter(this, void 0, void 0, function* () {
                yield loanOffer.signAsCreditor(creditor);
                yield setPrices();
                loanOffer.setCollateralAmount(210);
                yield loanOffer.signAsDebtor(debtor);
                yield loanOffer.acceptAsDebtor();
                const isAccepted = yield loanOffer.isAccepted();
                expect(isAccepted).equal(true);
            }));
        });
    });
}
exports.testAcceptAsDebtor = testAcceptAsDebtor;
//# sourceMappingURL=accept_as_debtor.js.map