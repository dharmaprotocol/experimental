import * as Web3 from "web3";
// Types
import { DebtOrder } from "../types/DebtOrder";
import { ECDSASignature, ecSign } from "../types/ECDSASignature";
import {
    CommitmentValues,
    CreditorCommitment,
    LTVParams,
    Price
} from "../types/LTVDecisionEngineTypes";
import { DebtOrderFixtures } from "./DebtOrders";

export class LTVFixtures {
    readonly debtOrderFixtures: DebtOrderFixtures;

    readonly blankSignature: ECDSASignature = {
        r: this.web3.utils.fromAscii(""),
        s: this.web3.utils.fromAscii(""),
        v: 0,
    };

    constructor(private readonly web3: Web3, private readonly accounts: string[]) {
        this.debtOrderFixtures = new DebtOrderFixtures(web3, accounts);
    }

    async signedParams(): Promise<LTVParams> {
        const params = await this.unsignedParams();

        const commitmentHash = this.commitmentHash(
            params.creditorCommitment.values,
            params.order,
        );

        params.creditorCommitment.signature = await ecSign(
            this.web3,
            commitmentHash,
            params.creditor
        );

        const principalPriceHash = this.priceHash(params.principalPrice);
        const collateralPriceHash = this.priceHash(params.collateralPrice);

        params.priceFeedOperator = this.accounts[2];

        params.collateralPrice.signature = await ecSign(
            this.web3,
            collateralPriceHash,
            params.priceFeedOperator,
        );

        params.principalPrice.signature = await ecSign(
            this.web3,
            principalPriceHash,
            params.priceFeedOperator,
        );

        return params;
    }

    async unsignedParams(): Promise<LTVParams> {
        const order = await this.debtOrderFixtures.unsignedOrder();

        const values = {
            principalToken: order.principalToken,
            principalAmount: 1,
            maxLTV: 100,
        };

        const creditorCommitment: CreditorCommitment = {
            values,
            signature: this.blankSignature,
        };

        const principalPrice: Price = {
            value: 1,
            tokenAddress: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
            timestamp: await this.currentBlockTimestamp(),
            signature: this.blankSignature,
        };

        const collateralPrice: Price = {
            value: 20,
            tokenAddress: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
            timestamp: await this.currentBlockTimestamp(),
            signature: this.blankSignature,
        };

        return {
            creditorCommitment,
            creditor: this.accounts[0],
            priceFeedOperator: this.accounts[1],
            principalPrice,
            collateralPrice,
            order,
        };
    }

    priceHash(price: Price): string {
        return this.web3.utils.soliditySha3(
            price.value,
            price.tokenAddress,
            price.timestamp
        );
    }

    commitmentHash(commitmentValues: CommitmentValues, order: DebtOrder): string {
        return this.web3.utils.soliditySha3(
            // LTV specific values.
            commitmentValues.maxLTV,
            order.principalToken,
            order.principalAmount,
            // Order specific values.
            order.creditor,
            order.issuanceVersion,
            order.creditorFee,
            order.underwriter,
            order.underwriterRiskRating,
            order.termsContract,
            order.termsContractParameters,
            order.expirationTimestampInSec,
            order.salt
        );
    }

    async currentBlockTimestamp(): Promise<number> {
        return (await this.web3.eth.getBlock("latest")).timestamp;
    }
}
