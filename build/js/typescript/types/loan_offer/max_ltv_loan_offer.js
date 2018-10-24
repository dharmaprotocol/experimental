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
const singleLineString = require("single-line-string");
const addressBook = require("dharma-address-book");
const contractArtifacts = require("dharma-contract-artifacts");
// Artifacts
const { DebtToken, TokenRegistry, LTVCreditorProxy } = contractArtifacts.latest;
// Types
const ECDSASignature_1 = require("../../../types/ECDSASignature");
const TermsContractParameters_1 = require("../../../types/TermsContractParameters");
const __1 = require("../");
// Utils
const utils_1 = require("../../utils");
// Configure BigNumber
utils_1.BigNumber.config({
    EXPONENTIAL_AT: 1000
});
const MAX_INTEREST_RATE_PRECISION = 4;
const FIXED_POINT_SCALING_FACTOR = Math.pow(10, MAX_INTEREST_RATE_PRECISION);
const SALT_DECIMALS = 10;
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
const NULL_ECDSA_SIGNATURE = {
    r: "0x0",
    s: "0x0",
    v: 0
};
exports.MAX_LTV_LOAN_OFFER_ERRORS = {
    ALREADY_SIGNED_BY_CREDITOR: () => `The creditor has already signed the loan offer.`,
    ALREADY_SIGNED_BY_DEBTOR: () => `The debtor has already signed the loan offer.`,
    COLLATERAL_AMOUNT_NOT_SET: () => `The collateral amount must be set first`,
    INSUFFICIENT_COLLATERAL_AMOUNT: (collateralAmount, collateralTokenSymbol) => singleLineString `Collateral of ${collateralAmount} ${collateralTokenSymbol} is insufficient
            for the maximum loan-to-value.`,
    PRICE_OF_INCORRECT_TOKEN: (receivedAddress, expectedAddress) => singleLineString `Received price of token at address ${receivedAddress},
            but expected price of token at address ${expectedAddress}.`,
    PRICES_NOT_SET: () => `The prices of the principal and collateral must be set first.`
};
class MaxLTVLoanOffer {
    constructor(ltvProxyAddress, web3, data) {
        this.ltvProxyAddress = ltvProxyAddress;
        this.web3 = web3;
        this.data = data;
    }
    static create(ltvProxyAddress, web3, params) {
        return __awaiter(this, void 0, void 0, function* () {
            const { collateralToken, creditorFeeAmount, debtorFeeAmount, expiresInDuration, expiresInUnit, interestRate, maxLTV, priceProvider, principalAmount, principalToken, relayerAddress, relayerFeeAmount, termDuration, termUnit } = params;
            const networkId = yield web3.eth.net.getId();
            const addresses = addressBook.latest[utils_1.NETWORK_ID_TO_NAME[networkId]];
            const tokenRegistryContract = new web3.eth.Contract(TokenRegistry, addresses.TokenRegistry);
            const kernelVersion = addresses.DebtKernel;
            const issuanceVersion = addresses.RepaymentRouter;
            const termsContract = addresses.CollateralizedSimpleInterestTermsContract;
            const principalTokenAddress = yield tokenRegistryContract.methods
                .getTokenAddressBySymbol(params.principalToken)
                .call();
            const collateralTokenAddress = yield tokenRegistryContract.methods
                .getTokenAddressBySymbol(params.collateralToken)
                .call();
            const principalTokenIndex = new utils_1.BigNumber(yield tokenRegistryContract.methods.getTokenIndexBySymbol(params.principalToken).call());
            const collateralTokenIndex = new utils_1.BigNumber(yield tokenRegistryContract.methods.getTokenIndexBySymbol(params.collateralToken).call());
            let relayer = NULL_ADDRESS;
            let relayerFee = new __1.TokenAmount(0, principalToken);
            let creditorFee = new utils_1.BigNumber(0);
            let debtorFee = new utils_1.BigNumber(0);
            if (relayerAddress && relayerFeeAmount) {
                relayer = relayerAddress;
                relayerFee = new __1.TokenAmount(relayerFeeAmount, principalToken);
            }
            if (creditorFeeAmount && creditorFeeAmount > 0) {
                const creditorFeeTokenAmount = new __1.TokenAmount(creditorFeeAmount, principalToken);
                creditorFee = creditorFeeTokenAmount.rawAmount;
            }
            if (debtorFeeAmount && debtorFeeAmount > 0) {
                const debtorFeeTokenAmount = new __1.TokenAmount(debtorFeeAmount, principalToken);
                debtorFee = debtorFeeTokenAmount.rawAmount;
            }
            const data = {
                collateralTokenAddress,
                collateralTokenIndex,
                collateralTokenSymbol: collateralToken,
                creditorFee,
                debtorFee,
                expiresIn: new __1.TimeInterval(expiresInDuration, expiresInUnit),
                interestRate: new __1.InterestRate(interestRate),
                issuanceVersion,
                kernelVersion,
                maxLTV: new utils_1.BigNumber(maxLTV),
                priceProvider,
                principal: new __1.TokenAmount(principalAmount, principalToken),
                principalTokenAddress,
                principalTokenIndex,
                relayer,
                relayerFee,
                salt: MaxLTVLoanOffer.generateSalt(),
                termLength: new __1.TimeInterval(termDuration, termUnit),
                termsContract
            };
            return new MaxLTVLoanOffer(ltvProxyAddress, web3, data);
        });
    }
    static createAndSignAsCreditor(ltvProxyAddress, web3, params, creditor) {
        return __awaiter(this, void 0, void 0, function* () {
            const offer = yield MaxLTVLoanOffer.create(ltvProxyAddress, web3, params);
            yield offer.signAsCreditor(creditor);
            return offer;
        });
    }
    static generateSalt() {
        return utils_1.BigNumber.random(SALT_DECIMALS).times(new utils_1.BigNumber(10).pow(SALT_DECIMALS));
    }
    /**
     * Eventually signs the loan offer as the creditor.
     *
     * @throws Throws if the loan offer is already signed by a creditor.
     *
     * @example
     * loanOffer.signAsCreditor();
     * => Promise<void>
     *
     * @return {Promise<void>}
     */
    signAsCreditor(creditorAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isSignedByCreditor()) {
                throw new Error(exports.MAX_LTV_LOAN_OFFER_ERRORS.ALREADY_SIGNED_BY_CREDITOR());
            }
            this.creditor = creditorAddress;
            const currentBlocktime = new utils_1.BigNumber((yield this.web3.eth.getBlock("latest")).timestamp);
            this.expirationTimestampInSec = this.data.expiresIn.fromTimestamp(currentBlocktime);
            const loanOfferHash = this.getCreditorCommitmentHash();
            const isMetaMask = !!this.web3.currentProvider.isMetaMask;
            // TODO: integrate MetaMask prefix
            this.creditorSignature = yield ECDSASignature_1.ecSign(this.web3, loanOfferHash, this.creditor);
        });
    }
    /**
     * Returns whether the loan offer has been signed by a creditor.
     *
     * @example
     * loanOffer.isSignedByCreditor();
     * => true
     *
     * @return {boolean}
     */
    isSignedByCreditor() {
        // TODO: check validity of signature
        if (this.creditorSignature) {
            return true;
        }
        return false;
    }
    /**
     * Sets the principal price.
     *
     * @throws Throws if the price is for the wrong token
     *
     * @example
     * loanOffer.setPrincipalPrice(signedPrincipalPrice);
     *
     */
    setPrincipalPrice(principalPrice) {
        if (principalPrice.tokenAddress !== this.data.principalTokenAddress) {
            throw new Error(exports.MAX_LTV_LOAN_OFFER_ERRORS.PRICE_OF_INCORRECT_TOKEN(principalPrice.tokenAddress, this.data.principalTokenAddress));
        }
        // TODO: assert signed time is within some delta of current time
        this.principalPrice = principalPrice;
    }
    /**
     * Gets the principal price.
     *
     * @example
     * loanOffer.getPrincipalPrice();
     *
     * @return {Price}
     */
    getPrincipalPrice() {
        return this.principalPrice;
    }
    /**
     * Sets the collateral price.
     *
     * @throws Throws if the price is for the wrong token
     *
     * @example
     * loanOffer.setCollateralPrice(signedPrincipalPrice);
     *
     */
    setCollateralPrice(collateralPrice) {
        if (collateralPrice.tokenAddress !== this.data.collateralTokenAddress) {
            throw new Error(exports.MAX_LTV_LOAN_OFFER_ERRORS.PRICE_OF_INCORRECT_TOKEN(collateralPrice.tokenAddress, this.data.collateralTokenAddress));
        }
        // TODO: assert signed time is within some delta of current time
        this.collateralPrice = collateralPrice;
    }
    /**
     * Gets the collateral price.
     *
     * @example
     * loanOffer.getCollateralPrice();
     *
     * @return {Price}
     */
    getCollateralPrice() {
        return this.principalPrice;
    }
    /**
     * Sets the collateral amount.
     *
     * @throws Throws if the collateral amount is insufficient.
     *
     * @example
     * loanOffer.setCollateralAmount(1000);
     *
     */
    setCollateralAmount(collateralAmount) {
        if (this.principalPrice && this.collateralPrice && !this.collateralAmountIsSufficient(collateralAmount)) {
            throw new Error(exports.MAX_LTV_LOAN_OFFER_ERRORS.INSUFFICIENT_COLLATERAL_AMOUNT(collateralAmount, this.data.collateralTokenSymbol));
        }
        this.collateralAmount = collateralAmount;
        // calculate the terms contract parameters, since the collateral amount has been set
        this.termsContractParameters = this.getTermsContractParameters();
    }
    /**
     * Gets the collateral amount.
     *
     * @example
     * loanOffer.getCollateralAmount();
     *
     * @return {Price}
     */
    getCollateralAmount() {
        return this.collateralAmount;
    }
    /**
     * Eventually signs the loan offer as the debtor.
     *
     * @throws Throws if the loan offer is already signed by a debtor.
     * @throws Throws if the prices are not set.
     * @throws Throws if the collateral amount is not set.
     * @throws Throws if the collateral amount is insufficient.
     *
     * @example
     * loanOffer.signAsDebtor();
     * => Promise<void>
     *
     * @return {Promise<void>}
     */
    signAsDebtor(debtorAddress) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.isSignedByDebtor()) {
                throw new Error(exports.MAX_LTV_LOAN_OFFER_ERRORS.ALREADY_SIGNED_BY_DEBTOR());
            }
            if (!this.principalPrice || !this.collateralPrice) {
                throw new Error(exports.MAX_LTV_LOAN_OFFER_ERRORS.PRICES_NOT_SET());
            }
            if (!this.collateralAmount) {
                throw new Error(exports.MAX_LTV_LOAN_OFFER_ERRORS.COLLATERAL_AMOUNT_NOT_SET());
            }
            if (!this.collateralAmountIsSufficient(this.collateralAmount)) {
                throw new Error(exports.MAX_LTV_LOAN_OFFER_ERRORS.INSUFFICIENT_COLLATERAL_AMOUNT(this.collateralAmount, this.data.collateralTokenSymbol));
            }
            this.debtor = debtorAddress;
            const isMetaMask = !!this.web3.currentProvider.isMetaMask;
            const debtorCommitmentHash = this.getDebtorCommitmentHash();
            // TODO: integrate MetaMask prefix?
            this.debtorSignature = yield ECDSASignature_1.ecSign(this.web3, debtorCommitmentHash, this.debtor);
        });
    }
    /**
     * Returns whether the loan offer has been signed by a debtor.
     *
     * @example
     * loanOffer.isSignedByDebtor();
     * => true
     *
     * @return {boolean}
     */
    isSignedByDebtor() {
        // TODO: check validity of signature
        if (this.debtorSignature) {
            return true;
        }
        return false;
    }
    acceptAsDebtor() {
        return __awaiter(this, void 0, void 0, function* () {
            const collateral = new __1.TokenAmount(this.collateralAmount, this.data.collateralTokenSymbol);
            // We convert BigNumbers into strings because of an issue with Web3 taking larger BigNumbers
            const lTVParams = {
                order: {
                    creditor: this.creditor,
                    principalToken: this.data.principalTokenAddress,
                    principalAmount: this.data.principal.rawAmount.toString(),
                    collateralAmount: collateral.rawAmount.toString(),
                    collateralToken: this.data.collateralTokenAddress,
                    debtor: this.debtor,
                    debtorFee: this.data.debtorFee.toString(),
                    relayer: this.data.relayer,
                    relayerFee: this.data.relayerFee.rawAmount.toString(),
                    underwriterFee: 0,
                    debtorSignature: this.debtorSignature,
                    underwriterSignature: NULL_ECDSA_SIGNATURE,
                    creditorSignature: this.creditorSignature,
                    // Order params
                    issuanceVersion: this.data.issuanceVersion,
                    kernelVersion: this.data.kernelVersion,
                    creditorFee: this.data.creditorFee.toString(),
                    underwriter: NULL_ADDRESS,
                    underwriterRiskRating: 0,
                    termsContract: this.data.termsContract,
                    termsContractParameters: this.termsContractParameters,
                    expirationTimestampInSec: this.expirationTimestampInSec.toString(),
                    salt: this.data.salt.toString()
                },
                priceFeedOperator: this.data.priceProvider,
                collateralPrice: this.collateralPrice,
                principalPrice: this.principalPrice,
                creditorCommitment: {
                    values: {
                        maxLTV: this.data.maxLTV.toString()
                    },
                    signature: this.creditorSignature
                },
                creditor: this.creditor
            };
            const lTVCreditorProxyContract = new this.web3.eth.Contract(LTVCreditorProxy, this.ltvProxyAddress);
            return lTVCreditorProxyContract.methods.fillDebtOffer(lTVParams).send({
                from: this.debtor,
                gas: 6712390
            });
        });
    }
    isAccepted() {
        return __awaiter(this, void 0, void 0, function* () {
            const networkId = yield this.web3.eth.net.getId();
            const addresses = addressBook.latest[utils_1.NETWORK_ID_TO_NAME[networkId]];
            const debtTokenContract = new this.web3.eth.Contract(DebtToken, addresses.DebtToken);
            const issuanceCommitmentHash = this.getIssuanceCommitmentHash();
            return debtTokenContract.methods.exists(issuanceCommitmentHash).call();
        });
    }
    getTermsContractCommitmentHash() {
        return this.web3.utils.soliditySha3(this.data.principalTokenIndex, this.data.principal.rawAmount, this.data.interestRate.raw.times(FIXED_POINT_SCALING_FACTOR).toNumber(), this.data.termLength.getAmortizationUnitType(), this.data.termLength.amount, this.data.collateralTokenIndex, 0 // grace period in days
        );
    }
    getCreditorCommitmentHash() {
        return this.web3.utils.soliditySha3(this.creditor, this.data.kernelVersion, this.data.issuanceVersion, this.data.termsContract, this.data.principalTokenAddress, this.data.salt, this.data.principal.rawAmount, this.data.creditorFee, this.expirationTimestampInSec, this.data.maxLTV, this.getTermsContractCommitmentHash());
    }
    getIssuanceCommitmentHash() {
        if (!this.collateralAmount) {
            throw new Error(exports.MAX_LTV_LOAN_OFFER_ERRORS.COLLATERAL_AMOUNT_NOT_SET());
        }
        // We remove underwriting as a feature, since the creditor has no mechanism to mandate a maximum
        // underwriter risk rating.
        return this.web3.utils.soliditySha3(this.data.kernelVersion, this.debtor, NULL_ADDRESS, // underwriter
        0, // undwriter risk rating
        this.data.termsContract, this.termsContractParameters, this.data.salt);
    }
    getDebtorCommitmentHash() {
        // We remove underwriting as a feature, since the creditor has no mechanism to mandate a maximum
        // underwriter risk rating.
        return this.web3.utils.soliditySha3(this.data.kernelVersion, this.getIssuanceCommitmentHash(), 0, // underwriter fee
        this.data.principal.rawAmount, this.data.principalTokenAddress, this.data.debtorFee, this.data.creditorFee, this.data.relayer, this.data.relayerFee.rawAmount, this.expirationTimestampInSec);
    }
    getTermsContractParameters() {
        const collateral = new __1.TokenAmount(this.collateralAmount, this.data.collateralTokenSymbol);
        // Pack terms contract parameters
        const collateralizedContractTerms = {
            collateralAmount: collateral.rawAmount.toNumber(),
            collateralTokenIndex: this.data.collateralTokenIndex.toNumber(),
            gracePeriodInDays: 0
        };
        const simpleInterestContractTerms = {
            principalTokenIndex: this.data.principalTokenIndex.toNumber(),
            principalAmount: this.data.principal.rawAmount.toNumber(),
            interestRateFixedPoint: this.data.interestRate.raw.times(FIXED_POINT_SCALING_FACTOR).toNumber(),
            amortizationUnitType: this.data.termLength.getAmortizationUnitType(),
            termLengthUnits: this.data.termLength.amount
        };
        return TermsContractParameters_1.CollateralizedSimpleInterestTermsParameters.pack(collateralizedContractTerms, simpleInterestContractTerms);
    }
    collateralAmountIsSufficient(collateralAmount) {
        if (!this.principalPrice || !this.collateralPrice) {
            return false;
        }
        // We do not use the TokenAmount's rawValue here because what matters is the "real world" amount
        // of the principal and collateral, without regard for how many decimals are used in their
        // blockchain representations.
        const principalValue = new utils_1.BigNumber(this.data.principal.decimalAmount).times(this.principalPrice.value);
        const collateralValue = new utils_1.BigNumber(collateralAmount).times(this.collateralPrice.value);
        return principalValue.div(collateralValue).lte(this.data.maxLTV.div(100));
    }
}
exports.MaxLTVLoanOffer = MaxLTVLoanOffer;
//# sourceMappingURL=max_ltv_loan_offer.js.map