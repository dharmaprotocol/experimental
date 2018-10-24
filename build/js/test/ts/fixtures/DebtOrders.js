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
const TermsContractParameters_1 = require("../../../types/TermsContractParameters");
const ECDSASignature_1 = require("../../../types/ECDSASignature");
class DebtOrderFixtures {
    constructor(web3, accounts, tokens, participants, contracts) {
        this.web3 = web3;
        this.accounts = accounts;
        this.tokens = tokens;
        this.participants = participants;
        this.contracts = contracts;
        this.blankSignature = {
            r: this.web3.utils.fromAscii(""),
            s: this.web3.utils.fromAscii(""),
            v: 0
        };
        this.amortizationUnitType = 1; // The amortization unit type (weekly)
        this.collateralAmount = 1;
        this.collateralTokenIndex = 1;
        this.gracePeriodInDays = 0;
        this.interestRateFixedPoint = 2.5 * Math.pow(10, 4); // interest rate of 2.5%
        this.principalAmount = 1; // principal of 1
        this.principalTokenIndex = 0;
        this.termLengthUnits = 4; // Term length in amortization units.
    }
    unsignedOrder() {
        return __awaiter(this, void 0, void 0, function* () {
            // The signatures will all be empty ECDSA signatures.
            const debtorSignature = this.blankSignature;
            const underwriterSignature = this.blankSignature;
            const creditorSignature = this.blankSignature;
            // Some time in seconds, defaulting to an hour past the current block's timestamp.
            const expirationTimestampInSec = (yield this.currentBlockTimestamp()) + 3600;
            // Pack terms contract parameters
            const collateralizedContractTerms = {
                collateralAmount: this.collateralAmount,
                collateralTokenIndex: this.collateralTokenIndex,
                gracePeriodInDays: this.gracePeriodInDays
            };
            const simpleInterestContractTerms = {
                principalTokenIndex: this.principalTokenIndex,
                principalAmount: this.principalAmount,
                interestRateFixedPoint: this.interestRateFixedPoint,
                amortizationUnitType: this.amortizationUnitType,
                termLengthUnits: this.termLengthUnits // Term length in amortization units.
            };
            const termsContractParameters = TermsContractParameters_1.CollateralizedSimpleInterestTermsParameters.pack(collateralizedContractTerms, simpleInterestContractTerms);
            return {
                kernelVersion: this.contracts.debtKernelAddress,
                issuanceVersion: this.contracts.repaymentRouterAddress,
                principalAmount: 1,
                principalToken: this.tokens.principalAddress,
                collateralAmount: 1,
                collateralToken: this.tokens.collateralAddress,
                debtor: this.participants.debtor,
                debtorFee: 0,
                creditor: this.participants.creditor,
                creditorFee: 0,
                relayer: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                relayerFee: 0,
                underwriter: "0x0000000000000000000000000000000000000000",
                underwriterFee: 0,
                underwriterRiskRating: 0,
                termsContract: this.contracts.termsContractAddress,
                termsContractParameters,
                expirationTimestampInSec,
                salt: 0,
                debtorSignature,
                creditorSignature,
                underwriterSignature
            };
        });
    }
    signedOrder() {
        return __awaiter(this, void 0, void 0, function* () {
            const unsignedOrder = yield this.unsignedOrder();
            const commitmentHash = this.creditorHashForOrder(unsignedOrder);
            const creditorSignature = yield ECDSASignature_1.ecSign(this.web3, commitmentHash, unsignedOrder.creditor);
            const debtorSignature = yield ECDSASignature_1.ecSign(this.web3, this.debtorHashForOrder(unsignedOrder), unsignedOrder.debtor);
            return Object.assign({}, unsignedOrder, { creditorSignature,
                debtorSignature });
        });
    }
    creditorHashForOrder(order) {
        return this.web3.utils.soliditySha3(order.creditor, order.kernelVersion, order.issuanceVersion, order.termsContract, order.principalToken, order.salt, order.principalAmount, order.creditorFee, order.expirationTimestampInSec, order.termsContractParameters);
    }
    debtorHashForOrder(order) {
        return this.web3.utils.soliditySha3(this.contracts.debtKernelAddress, this.getAgreementId(order), order.underwriterFee, order.principalAmount, order.principalToken, order.debtorFee, order.creditorFee, order.relayer, order.relayerFee, order.expirationTimestampInSec);
    }
    getAgreementId(order) {
        return this.web3.utils.soliditySha3(this.contracts.debtKernelAddress, // version
        this.participants.debtor, // debtor
        "0x0000000000000000000000000000000000000000", // underwriter
        order.underwriterRiskRating, order.termsContract, order.termsContractParameters, order.salt);
    }
    currentBlockTimestamp() {
        return __awaiter(this, void 0, void 0, function* () {
            return (yield this.web3.eth.getBlock("latest")).timestamp;
        });
    }
}
exports.DebtOrderFixtures = DebtOrderFixtures;
//# sourceMappingURL=DebtOrders.js.map