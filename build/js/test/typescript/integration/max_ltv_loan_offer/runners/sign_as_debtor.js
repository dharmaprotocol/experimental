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
// Artifacts
const TokenRegistry = artifacts.require("./TokenRegistry.sol");
const ltvCreditorProxyAddress = artifacts.require("./LTVCreditorProxy.sol").address;
const ECDSASignature_1 = require("../../../../../types/ECDSASignature");
const types_1 = require("../../../../../typescript/types");
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
function testSignAsDebtor(web3, params) {
    return __awaiter(this, void 0, void 0, function* () {
        const tokenRegistry = new web3.eth.Contract(TokenRegistry.abi, addresses.TokenRegistry);
        describe("passing valid params", () => {
            const priceProvider = params.priceProvider;
            let creditor;
            let debtor;
            let loanOffer;
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
            beforeEach(() => __awaiter(this, void 0, void 0, function* () {
                const accounts = yield web3.eth.getAccounts();
                creditor = accounts[0];
                debtor = accounts[1];
                loanOffer = yield types_1.MaxLTVLoanOffer.create(ltvCreditorProxyAddress, web3, params);
            }));
            it("signs the offer as the debtor if all prerequisites are met", () => __awaiter(this, void 0, void 0, function* () {
                const isSignedByDebtorBefore = loanOffer.isSignedByDebtor();
                expect(isSignedByDebtorBefore).equal(false);
                yield loanOffer.signAsCreditor(creditor);
                yield setPrices();
                loanOffer.setCollateralAmount(210);
                yield loanOffer.signAsDebtor(debtor);
                const isSignedByDebtorAfter = loanOffer.isSignedByDebtor();
                expect(isSignedByDebtorAfter).equal(true);
            }));
            describe("should throw", () => {
                it("when the debtor has already signed", () => __awaiter(this, void 0, void 0, function* () {
                    const isSignedByDebtorBefore = loanOffer.isSignedByDebtor();
                    expect(isSignedByDebtorBefore).equal(false);
                    yield loanOffer.signAsCreditor(creditor);
                    yield setPrices();
                    loanOffer.setCollateralAmount(210);
                    yield loanOffer.signAsDebtor(debtor);
                    expect(loanOffer.signAsDebtor(debtor)).to.eventually.be.rejectedWith(types_1.MAX_LTV_LOAN_OFFER_ERRORS.ALREADY_SIGNED_BY_DEBTOR());
                }));
                it("when prices are not set", () => __awaiter(this, void 0, void 0, function* () {
                    const isSignedByDebtorBefore = loanOffer.isSignedByDebtor();
                    expect(isSignedByDebtorBefore).equal(false);
                    yield loanOffer.signAsCreditor(creditor);
                    loanOffer.setCollateralAmount(210);
                    expect(loanOffer.signAsDebtor(debtor)).to.eventually.be.rejectedWith(types_1.MAX_LTV_LOAN_OFFER_ERRORS.PRICES_NOT_SET());
                }));
                it("when the collateral amount is not set", () => __awaiter(this, void 0, void 0, function* () {
                    const isSignedByDebtorBefore = loanOffer.isSignedByDebtor();
                    expect(isSignedByDebtorBefore).equal(false);
                    yield loanOffer.signAsCreditor(creditor);
                    yield setPrices();
                    expect(loanOffer.signAsDebtor(debtor)).to.eventually.be.rejectedWith(types_1.MAX_LTV_LOAN_OFFER_ERRORS.COLLATERAL_AMOUNT_NOT_SET());
                }));
                it("when the collateral amount is insufficient", () => __awaiter(this, void 0, void 0, function* () {
                    const isSignedByDebtorBefore = loanOffer.isSignedByDebtor();
                    expect(isSignedByDebtorBefore).equal(false);
                    yield loanOffer.signAsCreditor(creditor);
                    const collateralAmount = 10;
                    loanOffer.setCollateralAmount(collateralAmount);
                    yield setPrices();
                    expect(loanOffer.signAsDebtor(debtor)).to.eventually.be.rejectedWith(types_1.MAX_LTV_LOAN_OFFER_ERRORS.INSUFFICIENT_COLLATERAL_AMOUNT(collateralAmount, params.collateralToken));
                }));
            });
        });
    });
}
exports.testSignAsDebtor = testSignAsDebtor;
//# sourceMappingURL=sign_as_debtor.js.map