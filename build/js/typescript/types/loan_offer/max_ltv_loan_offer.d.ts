import * as Web3 from "web3";
import { InterestRate, TimeInterval, TokenAmount } from "../";
import { Price } from "../../../types/LTVTypes";
import { BigNumber } from "../../utils";
export declare const MAX_LTV_LOAN_OFFER_ERRORS: {
    ALREADY_SIGNED_BY_CREDITOR: () => string;
    ALREADY_SIGNED_BY_DEBTOR: () => string;
    COLLATERAL_AMOUNT_NOT_SET: () => string;
    INSUFFICIENT_COLLATERAL_AMOUNT: (collateralAmount: number, collateralTokenSymbol: string) => any;
    PRICE_OF_INCORRECT_TOKEN: (receivedAddress: string, expectedAddress: string) => any;
    PRICES_NOT_SET: () => string;
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
export declare type DurationUnit = "hour" | "hours" | "day" | "days" | "week" | "weeks" | "month" | "months" | "year" | "years";
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
export declare class MaxLTVLoanOffer {
    private readonly ltvProxyAddress;
    private readonly web3;
    private readonly data;
    static create(ltvProxyAddress: string, web3: Web3, params: MaxLTVParams): Promise<MaxLTVLoanOffer>;
    static createAndSignAsCreditor(ltvProxyAddress: string, web3: Web3, params: MaxLTVParams, creditor?: string): Promise<MaxLTVLoanOffer>;
    static generateSalt(): BigNumber;
    private collateralAmount?;
    private collateralPrice?;
    private creditor?;
    private creditorSignature?;
    private debtor?;
    private debtorSignature?;
    private expirationTimestampInSec?;
    private principalPrice?;
    private termsContractParameters?;
    constructor(ltvProxyAddress: string, web3: Web3, data: MaxLTVData);
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
    signAsCreditor(creditorAddress: string): Promise<void>;
    /**
     * Returns whether the loan offer has been signed by a creditor.
     *
     * @example
     * loanOffer.isSignedByCreditor();
     * => true
     *
     * @return {boolean}
     */
    isSignedByCreditor(): boolean;
    /**
     * Sets the principal price.
     *
     * @throws Throws if the price is for the wrong token
     *
     * @example
     * loanOffer.setPrincipalPrice(signedPrincipalPrice);
     *
     */
    setPrincipalPrice(principalPrice: Price): void;
    /**
     * Gets the principal price.
     *
     * @example
     * loanOffer.getPrincipalPrice();
     *
     * @return {Price}
     */
    getPrincipalPrice(): Price;
    /**
     * Sets the collateral price.
     *
     * @throws Throws if the price is for the wrong token
     *
     * @example
     * loanOffer.setCollateralPrice(signedPrincipalPrice);
     *
     */
    setCollateralPrice(collateralPrice: Price): void;
    /**
     * Gets the collateral price.
     *
     * @example
     * loanOffer.getCollateralPrice();
     *
     * @return {Price}
     */
    getCollateralPrice(): Price;
    /**
     * Sets the collateral amount.
     *
     * @throws Throws if the collateral amount is insufficient.
     *
     * @example
     * loanOffer.setCollateralAmount(1000);
     *
     */
    setCollateralAmount(collateralAmount: number): void;
    /**
     * Gets the collateral amount.
     *
     * @example
     * loanOffer.getCollateralAmount();
     *
     * @return {Price}
     */
    getCollateralAmount(): number;
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
    signAsDebtor(debtorAddress: string): Promise<void>;
    /**
     * Returns whether the loan offer has been signed by a debtor.
     *
     * @example
     * loanOffer.isSignedByDebtor();
     * => true
     *
     * @return {boolean}
     */
    isSignedByDebtor(): boolean;
    acceptAsDebtor(): Promise<void>;
    isAccepted(): Promise<boolean>;
    private getTermsContractCommitmentHash;
    private getCreditorCommitmentHash;
    private getIssuanceCommitmentHash;
    private getDebtorCommitmentHash;
    private getTermsContractParameters;
    private collateralAmountIsSufficient;
}
