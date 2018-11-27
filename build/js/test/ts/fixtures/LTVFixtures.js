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
const ECDSASignature_1 = require("../../../types/ECDSASignature");
const DebtOrders_1 = require("./DebtOrders");
class LTVFixtures {
    constructor(web3, accounts, tokens, participants, contracts) {
        this.web3 = web3;
        this.accounts = accounts;
        this.tokens = tokens;
        this.participants = participants;
        this.contracts = contracts;
        this.blankSignature = {
            r: this.web3.utils.fromAscii(""),
            s: this.web3.utils.fromAscii(""),
            v: 0,
        };
        this.debtOrderFixtures = new DebtOrders_1.DebtOrderFixtures(web3, accounts, tokens, participants, contracts);
    }
    signedParams() {
        return __awaiter(this, void 0, void 0, function* () {
            const params = yield this.unsignedParams();
            params.order = yield this.debtOrderFixtures.signedOrder();
            const commitmentHash = this.commitmentHash(params.creditorCommitment.values, params.order);
            params.creditorCommitment.signature = yield ECDSASignature_1.ecSign(this.web3, commitmentHash, params.creditor);
            const principalPriceHash = this.priceHash(params.principalPrice);
            const collateralPriceHash = this.priceHash(params.collateralPrice);
            params.collateralPrice.signature = yield ECDSASignature_1.ecSign(this.web3, collateralPriceHash, params.creditorCommitment.values.priceFeedOperator);
            params.principalPrice.signature = yield ECDSASignature_1.ecSign(this.web3, principalPriceHash, params.creditorCommitment.values.priceFeedOperator);
            return params;
        });
    }
    unsignedParams() {
        return __awaiter(this, void 0, void 0, function* () {
            const order = yield this.debtOrderFixtures.unsignedOrder();
            const values = {
                principalToken: order.principalToken,
                principalAmount: 1,
                maxLTV: 100,
                priceFeedOperator: this.accounts[2],
            };
            const creditorCommitment = {
                values,
                signature: this.blankSignature,
            };
            const principalPrice = {
                value: 1,
                tokenAddress: this.tokens.principalAddress,
                timestamp: yield this.currentBlockTimestamp(),
                signature: this.blankSignature,
            };
            const collateralPrice = {
                value: 20,
                tokenAddress: this.tokens.collateralAddress,
                timestamp: yield this.currentBlockTimestamp(),
                signature: this.blankSignature,
            };
            return {
                creditorCommitment,
                creditor: this.accounts[0],
                principalPrice,
                collateralPrice,
                order,
            };
        });
    }
    priceHash(price) {
        return this.web3.utils.soliditySha3(price.value, price.tokenAddress, price.timestamp);
    }
    commitmentHash(commitmentValues, order) {
        return this.web3.utils.soliditySha3(order.creditor, order.kernelVersion, order.issuanceVersion, order.termsContract, order.principalToken, order.salt, order.principalAmount, order.creditorFee, order.expirationTimestampInSec, commitmentValues.maxLTV, commitmentValues.priceFeedOperator, 
        // unpacked termsContractParameters
        this.web3.utils.soliditySha3(this.debtOrderFixtures.principalTokenIndex, this.debtOrderFixtures.principalAmount, this.debtOrderFixtures.interestRateFixedPoint, this.debtOrderFixtures.amortizationUnitType, this.debtOrderFixtures.termLengthUnits, this.debtOrderFixtures.collateralTokenIndex, this.debtOrderFixtures.gracePeriodInDays));
    }
    currentBlockTimestamp() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.web3.eth.getBlock("latest")).timestamp;
        });
    }
}
exports.LTVFixtures = LTVFixtures;
//# sourceMappingURL=LTVFixtures.js.map