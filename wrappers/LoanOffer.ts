import * as Web3 from "web3";
import { ECDSASignature, ecSign } from "../types/ECDSASignature";
import { LTVParams, Price } from "../types/LTVTypes";

// The interface that the creditor will use.
interface CreditorParams {
    maxLTV: number;
    principalToken: string;
    principalAmount: number;
    creditor: string;
}

// These would be provided by the relayer, and get signed by the creditor as well.
interface OrderParams {
    issuanceVersion: string;
    kernelVersion: string;
    creditorFee: number;
    underwriter: string;
    underwriterRiskRating: number;
    termsContract: string;
    termsContractParameters: string;
    expirationTimestampInSec: number;
    salt: number;
}

// The values that the creditor needs to sign.
interface CreditorCommitmentValues {
    maxLTV: number;
    principalToken: string;
    principalAmount: number;
    creditor: string;
    issuanceVersion: string;
    kernelVersion: string;
    creditorFee: number;
    underwriter: string;
    underwriterRiskRating: number;
    termsContract: string;
    expirationTimestampInSec: number;
    salt: number;
}

class LoanOffer {
    private readonly commitmentValues: CreditorCommitmentValues;
    private readonly commitmentHash: string;
    // A web3 contract instance.
    private readonly proxy: any;

    private readonly blankSignature: ECDSASignature = {
        r: this.web3.utils.fromAscii(""),
        s: this.web3.utils.fromAscii(""),
        v: 0
    };

    private lTVParams: LTVParams;

    constructor(
        private readonly web3: Web3,
        ltvCreditorProxyABI: any[],
        ltvCreditorProxyAddress: string,
        creditorParams: CreditorParams,
        orderParams: OrderParams
    ) {
        this.proxy = new web3.eth.Contract(ltvCreditorProxyABI, ltvCreditorProxyAddress);

        this.commitmentValues = {
            ...creditorParams,
            ...orderParams
        };

        this.commitmentHash = this.generateCommitmentHash();

        // Set up an initial LTVParams object, which needs to be filled in.
        this.lTVParams = {
            order: {
                creditor: creditorParams.creditor,
                principalToken: creditorParams.principalToken,
                principalAmount: creditorParams.principalAmount,
                collateralAmount: 0,
                collateralToken: "",
                debtor: "",
                debtorFee: 0,
                relayer: "",
                relayerFee: 0,
                underwriterFee: 0,
                debtorSignature: this.blankSignature,
                underwriterSignature: this.blankSignature,
                // This stays a blank signature forever.
                creditorSignature: this.blankSignature,
                ...orderParams
            },
            priceFeedOperator: "",
            collateralPrice: {
                value: 0,
                timestamp: 0,
                tokenAddress: "",
                signature: this.blankSignature
            },
            principalPrice: {
                value: 0,
                timestamp: 0,
                tokenAddress: creditorParams.principalToken,
                signature: this.blankSignature
            },
            creditorCommitment: {
                values: {
                    maxLTV: creditorParams.maxLTV
                },
                signature: this.blankSignature
            },
            creditor: creditorParams.creditor
        };
    }

    // Returns a transaction receipt.
    async fillOffer() {
        return this.proxy.methods.fillDebtOffer(this.lTVParams).send({
            from: this.lTVParams.creditor,
            gas: 6712390
        });
    }

    // Adds a signature to the creditor commitment signature object.
    async signOfferByCreditor() {
        this.lTVParams.creditorCommitment.signature = await ecSign(
            this.web3,
            this.commitmentHash,
            this.commitmentValues.creditor
        );
    }

    async addPriceData(priceFeedOperator: string, principalPrice: Price, collateralPrice: Price) {
        this.lTVParams.principalPrice = principalPrice;
        this.lTVParams.collateralPrice = collateralPrice;
        this.lTVParams.priceFeedOperator = priceFeedOperator;
    }

    generateCommitmentHash() {
        const values = this.commitmentValues;

        return this.web3.utils.soliditySha3(
            values.maxLTV,
            values.principalToken,
            values.principalAmount,
            values.creditor,
            values.issuanceVersion,
            values.kernelVersion,
            values.creditorFee,
            values.underwriter,
            values.underwriterRiskRating,
            values.termsContract,
            values.expirationTimestampInSec,
            values.salt
        );
    }
}
