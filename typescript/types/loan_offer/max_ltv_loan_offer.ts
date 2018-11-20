// External libraries
import * as Web3 from "web3";
import * as singleLineString from "single-line-string";
import * as addressBook from "dharma-address-book";
import * as contractArtifacts from "dharma-contract-artifacts";

// Artifacts
const { DebtToken, TokenRegistry, LTVCreditorProxy } = contractArtifacts.latest;

// Types
import { ecSign, ECDSASignature } from "../../../types/ECDSASignature";
import {
    CollateralizedContractTerms,
    CollateralizedSimpleInterestTermsParameters,
    SimpleInterestContractTerms,
} from "../../../types/TermsContractParameters";
import { InterestRate, TimeInterval, TokenAmount } from "../";
import { LTVParams, Price } from "../../../types/LTVTypes";

// Utils
import { BigNumber, NETWORK_ID_TO_NAME } from "../../utils";

// Configure BigNumber
BigNumber.config({
    EXPONENTIAL_AT: 1000,
});

const MAX_INTEREST_RATE_PRECISION = 4;
const FIXED_POINT_SCALING_FACTOR = 10 ** MAX_INTEREST_RATE_PRECISION;
const SALT_DECIMALS = 10;
const NULL_ADDRESS = "0x0000000000000000000000000000000000000000";
const NULL_ECDSA_SIGNATURE = {
    r: "0x0",
    s: "0x0",
    v: 0,
};

export const MAX_LTV_LOAN_OFFER_ERRORS = {
    ALREADY_SIGNED_BY_CREDITOR: () =>
        `The creditor has already signed the loan offer.`,
    ALREADY_SIGNED_BY_DEBTOR: () =>
        `The debtor has already signed the loan offer.`,
    COLLATERAL_AMOUNT_NOT_SET: () => `The collateral amount must be set first`,
    INSUFFICIENT_COLLATERAL_AMOUNT: (
        collateralAmount: number,
        collateralTokenSymbol: string
    ) =>
        singleLineString`Collateral of ${collateralAmount} ${collateralTokenSymbol} is insufficient
            for the maximum loan-to-value.`,
    PRICE_OF_INCORRECT_TOKEN: (
        receivedAddress: string,
        expectedAddress: string
    ) =>
        singleLineString`Received price of token at address ${receivedAddress},
            but expected price of token at address ${expectedAddress}.`,
    PRICES_NOT_SET: () =>
        `The prices of the principal and collateral must be set first.`,
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

export type DurationUnit =
    | "hour"
    | "hours"
    | "day"
    | "days"
    | "week"
    | "weeks"
    | "month"
    | "months"
    | "year"
    | "years";

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
    public static async create(
        ltvProxyAddress: string,
        web3: Web3,
        params: MaxLTVParams
    ): Promise<MaxLTVLoanOffer> {
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
            termUnit,
        } = params;

        const networkId = await web3.eth.net.getId();

        const addresses = addressBook.latest[NETWORK_ID_TO_NAME[networkId]];

        const tokenRegistryContract = new web3.eth.Contract(
            TokenRegistry,
            addresses.TokenRegistry
        );

        const kernelVersion = addresses.DebtKernel;
        const issuanceVersion = addresses.RepaymentRouter;
        const termsContract =
            addresses.CollateralizedSimpleInterestTermsContract;

        const principalTokenAddress = await tokenRegistryContract.methods
            .getTokenAddressBySymbol(params.principalToken)
            .call();
        const collateralTokenAddress = await tokenRegistryContract.methods
            .getTokenAddressBySymbol(params.collateralToken)
            .call();

        const principalTokenIndex = new BigNumber(
            await tokenRegistryContract.methods
                .getTokenIndexBySymbol(params.principalToken)
                .call()
        );
        const collateralTokenIndex = new BigNumber(
            await tokenRegistryContract.methods
                .getTokenIndexBySymbol(params.collateralToken)
                .call()
        );

        let relayer = NULL_ADDRESS;
        let relayerFee = new TokenAmount(0, principalToken);
        let creditorFee = new BigNumber(0);
        let debtorFee = new BigNumber(0);

        if (relayerAddress && relayerFeeAmount) {
            relayer = relayerAddress;
            relayerFee = new TokenAmount(relayerFeeAmount, principalToken);
        }

        if (creditorFeeAmount && creditorFeeAmount > 0) {
            const creditorFeeTokenAmount = new TokenAmount(
                creditorFeeAmount,
                principalToken
            );
            creditorFee = creditorFeeTokenAmount.rawAmount;
        }

        if (debtorFeeAmount && debtorFeeAmount > 0) {
            const debtorFeeTokenAmount = new TokenAmount(
                debtorFeeAmount,
                principalToken
            );
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
            termsContract,
        };

        return new MaxLTVLoanOffer(ltvProxyAddress, web3, data);
    }

    public static async createAndSignAsCreditor(
        ltvProxyAddress: string,
        web3: Web3,
        params: MaxLTVParams,
        creditor?: string
    ): Promise<MaxLTVLoanOffer> {
        const offer = await MaxLTVLoanOffer.create(
            ltvProxyAddress,
            web3,
            params
        );

        await offer.signAsCreditor(creditor);

        return offer;
    }

    public static generateSalt(): BigNumber {
        return BigNumber.random(SALT_DECIMALS).times(
            new BigNumber(10).pow(SALT_DECIMALS)
        );
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

    constructor(
        private readonly ltvProxyAddress: string,
        private readonly web3: Web3,
        private readonly data: MaxLTVData
    ) {}

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
            throw new Error(
                MAX_LTV_LOAN_OFFER_ERRORS.ALREADY_SIGNED_BY_CREDITOR()
            );
        }

        this.creditor = creditorAddress;

        const currentBlocktime = new BigNumber(
            (await this.web3.eth.getBlock("latest")).timestamp
        );

        this.expirationTimestampInSec = this.data.expiresIn.fromTimestamp(
            currentBlocktime
        );

        const loanOfferHash = this.getCreditorCommitmentHash();

        const isMetaMask = !!this.web3.currentProvider.isMetaMask;

        // TODO: integrate MetaMask prefix
        this.creditorSignature = await ecSign(
            this.web3,
            loanOfferHash,
            this.creditor
        );
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
        if (
            this.principalPrice &&
            this.collateralPrice &&
            !this.collateralAmountIsSufficient(collateralAmount)
        ) {
            throw new Error(
                MAX_LTV_LOAN_OFFER_ERRORS.INSUFFICIENT_COLLATERAL_AMOUNT(
                    collateralAmount,
                    this.data.collateralTokenSymbol
                )
            );
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
            throw new Error(
                MAX_LTV_LOAN_OFFER_ERRORS.ALREADY_SIGNED_BY_DEBTOR()
            );
        }

        if (!this.principalPrice || !this.collateralPrice) {
            throw new Error(MAX_LTV_LOAN_OFFER_ERRORS.PRICES_NOT_SET());
        }

        if (!this.collateralAmount) {
            throw new Error(
                MAX_LTV_LOAN_OFFER_ERRORS.COLLATERAL_AMOUNT_NOT_SET()
            );
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
        this.debtorSignature = await ecSign(
            this.web3,
            debtorCommitmentHash,
            this.debtor
        );
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
        const collateral = new TokenAmount(
            this.collateralAmount,
            this.data.collateralTokenSymbol
        );

        // We convert BigNumbers into strings because of an issue with Web3 taking larger BigNumbers
        const lTVParams: LTVParams = {
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
                salt: this.data.salt.toString(),
            },
            collateralPrice: this.collateralPrice,
            principalPrice: this.principalPrice,
            creditorCommitment: {
                values: {
                    maxLTV: this.data.maxLTV.toString(),
                    priceFeedOperator: this.data.priceProvider,
                },
                signature: this.creditorSignature,
            },
            creditor: this.creditor,
        };

        console.log("creditor: ", this.creditor);
        console.log("price provider: ", this.data.priceProvider);

        const lTVCreditorProxyContract = new this.web3.eth.Contract(
            LTVCreditorProxy,
            this.ltvProxyAddress
        );

        return lTVCreditorProxyContract.methods.fillDebtOffer(lTVParams).send({
            from: this.debtor,
            gas: 6712390,
        });
    }

    public async isAccepted(): Promise<boolean> {
        const networkId = await this.web3.eth.net.getId();

        const addresses = addressBook.latest[NETWORK_ID_TO_NAME[networkId]];

        const debtTokenContract = new this.web3.eth.Contract(
            DebtToken,
            addresses.DebtToken
        );

        const issuanceCommitmentHash = this.getIssuanceCommitmentHash();

        return debtTokenContract.methods.exists(issuanceCommitmentHash).call();
    }

    private getTermsContractCommitmentHash(): string {
        return this.web3.utils.soliditySha3(
            this.data.principalTokenIndex,
            this.data.principal.rawAmount,
            this.data.interestRate.raw
                .times(FIXED_POINT_SCALING_FACTOR)
                .toNumber(),
            this.data.termLength.getAmortizationUnitType(),
            this.data.termLength.amount,
            this.data.collateralTokenIndex,
            0 // grace period in days
        );
    }

    private getCreditorCommitmentHash(): string {
        return this.web3.utils.soliditySha3(
            this.creditor,
            this.data.kernelVersion,
            this.data.issuanceVersion,
            this.data.termsContract,
            this.data.principalTokenAddress,
            this.data.salt,
            this.data.principal.rawAmount,
            this.data.creditorFee,
            this.expirationTimestampInSec,
            this.data.maxLTV,
            this.data.priceProvider,
            this.getTermsContractCommitmentHash()
        );
    }

    private getIssuanceCommitmentHash(): string {
        if (!this.collateralAmount) {
            throw new Error(
                MAX_LTV_LOAN_OFFER_ERRORS.COLLATERAL_AMOUNT_NOT_SET()
            );
        }

        // We remove underwriting as a feature, since the creditor has no mechanism to mandate a maximum
        // underwriter risk rating.

        return this.web3.utils.soliditySha3(
            this.data.kernelVersion,
            this.debtor,
            NULL_ADDRESS, // underwriter
            0, // undwriter risk rating
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
            0, // underwriter fee
            this.data.principal.rawAmount,
            this.data.principalTokenAddress,
            this.data.debtorFee,
            this.data.creditorFee,
            this.data.relayer,
            this.data.relayerFee.rawAmount,
            this.expirationTimestampInSec
        );
    }

    private getTermsContractParameters(): string {
        const collateral = new TokenAmount(
            this.collateralAmount,
            this.data.collateralTokenSymbol
        );

        // Pack terms contract parameters
        const collateralizedContractTerms: CollateralizedContractTerms = {
            collateralAmount: collateral.rawAmount.toNumber(),
            collateralTokenIndex: this.data.collateralTokenIndex.toNumber(),
            gracePeriodInDays: 0,
        };

        const simpleInterestContractTerms: SimpleInterestContractTerms = {
            principalTokenIndex: this.data.principalTokenIndex.toNumber(),
            principalAmount: this.data.principal.rawAmount.toNumber(),
            interestRateFixedPoint: this.data.interestRate.raw
                .times(FIXED_POINT_SCALING_FACTOR)
                .toNumber(),
            amortizationUnitType: this.data.termLength.getAmortizationUnitType(),
            termLengthUnits: this.data.termLength.amount,
        };

        return CollateralizedSimpleInterestTermsParameters.pack(
            collateralizedContractTerms,
            simpleInterestContractTerms
        );
    }

    private collateralAmountIsSufficient(collateralAmount: number): boolean {
        if (!this.principalPrice || !this.collateralPrice) {
            return false;
        }

        // We do not use the TokenAmount's rawValue here because what matters is the "real world" amount
        // of the principal and collateral, without regard for how many decimals are used in their
        // blockchain representations.
        const principalValue = new BigNumber(
            this.data.principal.decimalAmount
        ).times(this.principalPrice.value);

        const collateralValue = new BigNumber(collateralAmount).times(
            this.collateralPrice.value
        );

        return principalValue
            .div(collateralValue)
            .lte(this.data.maxLTV.div(100));
    }
}
