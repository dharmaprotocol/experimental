// External libraries
import * as Web3 from "web3";
import * as singleLineString from "single-line-string";

import { ecSign, ECDSASignature } from "../../../test/ts/types/ECDSASignature";

import { InterestRate, TimeInterval, TokenAmount } from "../";

import { Price } from "../../../test/ts/types/LTVDecisionEngineTypes";

import { BigNumber } from "../../utils/bignumber";

// Configure BigNumber
BigNumber.config({
    EXPONENTIAL_AT: 1000
});

const MAX_INTEREST_RATE_PRECISION = 4;
const FIXED_POINT_SCALING_FACTOR = 10 ** MAX_INTEREST_RATE_PRECISION;
const SALT_DECIMALS = 20;
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
const NULL_ECDSA_SIGNATURE = {
    r: "",
    s: "",
    v: 0
};

export const MAX_LTV_LOAN_OFFER_ERRORS = {
    ALREADY_SIGNED_BY_CREDITOR: () => `The creditor has already signed the loan offer.`,
    ALREADY_SIGNED_BY_DEBTOR: () => `The debtor has already signed the loan offer.`,
    COLLATERAL_AMOUNT_NOT_SET: () => `The collateral amount must be set first`,
    INSUFFICIENT_COLLATERAL_AMOUNT: (collateralAmount: number, collateralTokenSymbol: string) =>
        singleLineString`Collateral of ${collateralAmount} ${collateralTokenSymbol} is insufficient
            for the maximum loan-to-value.`,
    PRICE_OF_INCORRECT_TOKEN: (receivedAddress: string, expectedAddress: string) =>
        singleLineString`Received price of token at address ${receivedAddress},
            but expected price of token at address ${expectedAddress}.`,
    PRICES_NOT_SET: () => `The prices of the principal and collateral must be set first.`
};

export interface MaxLTVData {
    collateralTokenAddress: string;
    collateralTokenIndex: BigNumber;
    collateralTokenSymbol: string;
    creditorFee: BigNumber;
    debtorFee: BigNumber;
    expiresIn: TimeInterval;
    interestRate: InterestRate;
    issuanceVersion: string;
    kernelVersion: string;
    maxLTV: BigNumber;
    priceProvider: string;
    principal: TokenAmount;
    principalTokenAddress: string;
    principalTokenIndex: BigNumber;
    relayer: string;
    relayerFee: TokenAmount;
    salt: BigNumber;
    termLength: TimeInterval;
    termsContract: string;
}

export type DurationUnit = "hour" | "hours" | "day" | "days" | "week" | "weeks" | "month" | "months" | "year" | "years";

export interface DebtOrderParams {
    principalAmount: number;
    principalToken: string;
    interestRate: number;
    termDuration: number;
    termUnit: DurationUnit;
    expiresInDuration: number;
    expiresInUnit: DurationUnit;
    relayerAddress?: string;
    relayerFeeAmount?: number;
    creditorFeeAmount?: number;
    underwriterAddress?: string;
    underwriterRiskRating?: number;
    underwriterFeeAmount?: number;
    debtorFeeAmount?: number;
}

export interface MaxLTVParams extends DebtOrderParams {
    maxLTV: number;
    collateralToken: string;
    priceProvider: string;
}

export class MaxLTVLoanOffer {
    // TODO: replace with decision engine address (async function?)
    public static decisionEngineAddress = "test";

    public static async create(web3: Web3, params: MaxLTVParams): Promise<MaxLTVLoanOffer> {
        const {
            collateralToken,
            creditorFeeAmount,
            debtorFeeAmount,
            expiresInDuration,
            expiresInUnit,
            interestRate,
            maxLTV,
            priceProvider,
            principalAmount,
            principalToken,
            relayerAddress,
            relayerFeeAmount,
            termDuration,
            termUnit
        } = params;

        // TODO: use address book to get appropriate addresses
        const kernelVersion = "";
        const issuanceVersion = "";
        const termsContract = "";
        const principalTokenAddress = "";
        const collateralTokenAddress = "";

        // TODO: hard-code the token indices
        const principalTokenIndex = "";
        const collateralTokenIndex = "";

        let relayer = NULL_ADDRESS;
        let relayerFee = new TokenAmount(0, principalToken);
        let creditorFee = new BigNumber(0);
        let debtorFee = new BigNumber(0);

        if (relayerAddress && relayerFeeAmount) {
            relayer = relayerAddress;
            relayerFee = new TokenAmount(relayerFeeAmount, principalToken);
        }

        if (creditorFeeAmount && creditorFeeAmount > 0) {
            const creditorFeeTokenAmount = new TokenAmount(creditorFeeAmount, principalToken);
            creditorFee = creditorFeeTokenAmount.rawAmount;
        }

        if (debtorFeeAmount && debtorFeeAmount > 0) {
            const debtorFeeTokenAmount = new TokenAmount(debtorFeeAmount, principalToken);
            debtorFee = debtorFeeTokenAmount.rawAmount;
        }

        const data: MaxLTVData = {
            collateralTokenAddress,
            collateralTokenIndex,
            collateralTokenSymbol: collateralToken,
            creditorFee,
            debtorFee,
            expiresIn: new TimeInterval(expiresInDuration, expiresInUnit),
            interestRate: new InterestRate(interestRate),
            issuanceVersion,
            kernelVersion,
            maxLTV: new BigNumber(maxLTV),
            priceProvider,
            principal: new TokenAmount(principalAmount, principalToken),
            principalTokenAddress,
            principalTokenIndex,
            relayer,
            relayerFee,
            salt: MaxLTVLoanOffer.generateSalt(),
            termLength: new TimeInterval(termDuration, termUnit),
            termsContract
        };

        return new MaxLTVLoanOffer(web3, data);
    }

    public static async createAndSignAsCreditor(
        web3: Web3,
        params: MaxLTVParams,
        creditor?: string
    ): Promise<MaxLTVLoanOffer> {
        const offer = await MaxLTVLoanOffer.create(web3, params);

        await offer.signAsCreditor(creditor);

        return offer;
    }

    public static generateSalt(): BigNumber {
        return BigNumber.random(SALT_DECIMALS).times(new BigNumber(10).pow(SALT_DECIMALS));
    }

    private collateralAmount?: number;
    private collateralPrice?: Price;
    private creditor?: string;
    private creditorSignature?: ECDSASignature;
    private debtor?: string;
    private debtorSignature?: ECDSASignature;
    private expirationTimestampInSec?: BigNumber;
    private principalPrice?: Price;
    private termsContractParameters?: string;

    constructor(private readonly web3: Web3, private readonly data: MaxLTVData) {}

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
    public async signAsCreditor(creditorAddress: string): Promise<void> {
        if (this.isSignedByCreditor()) {
            throw new Error(MAX_LTV_LOAN_OFFER_ERRORS.ALREADY_SIGNED_BY_CREDITOR());
        }

        this.creditor = creditorAddress;

        const currentBlocktime = new BigNumber((await this.web3.eth.getBlock("latest")).timestamp);

        this.expirationTimestampInSec = this.data.expiresIn.fromTimestamp(currentBlocktime);

        const loanOfferHash = this.getCreditorCommitmentHash();

        const isMetaMask = !!this.web3.currentProvider.isMetaMask;

        // TODO: integrate MetaMask prefix
        this.creditorSignature = await ecSign(this.web3, loanOfferHash, this.creditor);
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
    public isSignedByCreditor(): boolean {
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
    public setPrincipalPrice(principalPrice: Price) {
        if (principalPrice.tokenAddress !== this.data.principalTokenAddress) {
            throw new Error(
                MAX_LTV_LOAN_OFFER_ERRORS.PRICE_OF_INCORRECT_TOKEN(
                    principalPrice.tokenAddress,
                    this.data.principalTokenAddress
                )
            );
        }

        // TODO: assert signed time is within some delta of current time (?)

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
    public getPrincipalPrice(): Price {
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
    public setCollateralPrice(collateralPrice: Price) {
        if (collateralPrice.tokenAddress !== this.data.collateralTokenAddress) {
            throw new Error(
                MAX_LTV_LOAN_OFFER_ERRORS.PRICE_OF_INCORRECT_TOKEN(
                    collateralPrice.tokenAddress,
                    this.data.collateralTokenAddress
                )
            );
        }

        // TODO: assert signed time is within some delta of current time (?)

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
    public getCollateralPrice(): Price {
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
    public setCollateralAmount(collateralAmount: number) {
        if (this.principalPrice && this.collateralPrice && !this.collateralAmountIsSufficient(collateralAmount)) {
            throw new Error(
                MAX_LTV_LOAN_OFFER_ERRORS.INSUFFICIENT_COLLATERAL_AMOUNT(
                    collateralAmount,
                    this.data.collateralTokenSymbol
                )
            );
        }

        this.collateralAmount = collateralAmount;

        this.termsContractParameters = this.packTermsContractParameters();
    }

    /**
     * Gets the collateral amount.
     *
     * @example
     * loanOffer.getCollateralAmount();
     *
     * @return {Price}
     */
    public getCollateralAmount(): number {
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
    public async signAsDebtor(debtorAddress: string): Promise<void> {
        if (this.isSignedByDebtor()) {
            throw new Error(MAX_LTV_LOAN_OFFER_ERRORS.ALREADY_SIGNED_BY_DEBTOR());
        }

        if (!this.principalPrice || !this.collateralPrice) {
            throw new Error(MAX_LTV_LOAN_OFFER_ERRORS.PRICES_NOT_SET());
        }

        if (!this.collateralAmount) {
            throw new Error(MAX_LTV_LOAN_OFFER_ERRORS.COLLATERAL_AMOUNT_NOT_SET());
        }

        if (!this.collateralAmountIsSufficient(this.collateralAmount)) {
            throw new Error(
                MAX_LTV_LOAN_OFFER_ERRORS.INSUFFICIENT_COLLATERAL_AMOUNT(
                    this.collateralAmount,
                    this.data.collateralTokenSymbol
                )
            );
        }

        this.debtor = debtorAddress;

        const isMetaMask = !!this.web3.currentProvider.isMetaMask;

        const debtorCommitmentHash = this.getDebtorCommitmentHash();

        // TODO: integrate MetaMask prefix?
        this.debtorSignature = await ecSign(this.web3, debtorCommitmentHash, this.debtor);
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
    public isSignedByDebtor(): boolean {
        // TODO: check validity of signature
        if (this.debtorSignature) {
            return true;
        }

        return false;
    }

    public async acceptAsDebtor(): Promise<void> {
        // TODO: send transaction to CreditorProxyContract
    }

    private getCreditorCommitmentTermsHash(): string {
        return this.web3.utils.soliditySha3(
            this.data.kernelVersion,
            this.data.issuanceVersion,
            this.data.termsContract,
            this.data.principal.rawAmount,
            this.data.principalTokenAddress,
            this.data.collateralTokenAddress,
            this.data.maxLTV,
            this.data.interestRate.raw.mul(FIXED_POINT_SCALING_FACTOR),
            this.data.debtorFee,
            this.data.creditorFee,
            this.data.relayer,
            this.data.relayerFee.rawAmount,
            this.expirationTimestampInSec,
            this.data.salt
        );
    }

    private getCreditorCommitmentHash(): string {
        return this.web3.utils.soliditySha3(
            MaxLTVLoanOffer.decisionEngineAddress,
            this.getCreditorCommitmentTermsHash()
        );
    }

    private getIssuanceCommitmentHash(): string {
        if (!this.collateralAmount) {
            throw new Error(MAX_LTV_LOAN_OFFER_ERRORS.COLLATERAL_AMOUNT_NOT_SET());
        }

        // We remove underwriting as a feature, since the creditor has no mechanism to mandate a maximum
        // underwriter risk rating.

        return this.web3.utils.soliditySha3(
            this.data.issuanceVersion,
            this.debtor,
            NULL_ADDRESS, // underwriter
            new BigNumber(0), // undwriter risk rating
            this.data.termsContract,
            this.termsContractParameters,
            this.data.salt
        );
    }

    private getDebtorCommitmentHash(): string {
        // We remove underwriting as a feature, since the creditor has no mechanism to mandate a maximum
        // underwriter risk rating.

        return this.web3.utils.soliditySha3(
            this.data.kernelVersion,
            this.getIssuanceCommitmentHash(),
            new BigNumber(0), // underwriter fee
            this.data.principal.rawAmount,
            this.data.principalTokenAddress,
            this.data.debtorFee,
            this.data.creditorFee,
            this.data.relayer,
            this.data.relayerFee.rawAmount,
            this.expirationTimestampInSec
        );
    }

    private collateralAmountIsSufficient(collateralAmount: number): boolean {
        if (!this.principalPrice || !this.collateralPrice) {
            return false;
        }

        // We do not use the TokenAmount's rawValue here because what matters is the "real world" amount
        // of the principal and collateral, without regard for how many decimals are used in their
        // blockchain representations.
        const principalValue = new BigNumber(this.data.principal.decimalAmount).times(this.principalPrice.value);

        const collateralValue = new BigNumber(collateralAmount).times(this.collateralPrice.value);

        return principalValue.div(collateralValue).lte(this.data.maxLTV.div(100));
    }

    private packTermsContractParameters(): string {
        if (!this.collateralAmount) {
            throw new Error(MAX_LTV_LOAN_OFFER_ERRORS.COLLATERAL_AMOUNT_NOT_SET());
        }

        const { collateralTokenIndex, principalTokenIndex } = this.data;

        const collateralTokenAmount = new TokenAmount(this.collateralAmount, this.data.collateralTokenSymbol);

        const simpleInterestTerms = {
            principalAmount: this.data.principal.rawAmount,
            interestRate: this.data.interestRate.raw,
            amortizationUnit: this.data.termLength.getAmortizationUnit(),
            termLength: new BigNumber(this.data.termLength.amount),
            principalTokenIndex
        };
        const collateralizedSimpleInterestTerms = {
            collateralTokenIndex,
            collateralAmount: collateralTokenAmount.rawAmount,
            gracePeriodInDays: new BigNumber(0)
        };

        // TODO: implement pack parameters
        return packParameters(simpleInterestTerms, collateralizedSimpleInterestTerms);
    }
}
