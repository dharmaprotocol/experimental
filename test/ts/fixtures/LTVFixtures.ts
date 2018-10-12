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
        const params = this.unsignedParams;

        const commitmentHash = this.commitmentHash(
            params.creditorCommitment.values,
            params.order,
        );

        params.creditorCommitment.signature = await ecSign(
            this.web3,
            commitmentHash,
            params.creditor
        );

        return params;
    }

    get unsignedParams(): LTVParams {
        const order = this.debtOrderFixtures.unsignedOrder;

        const values = {
            principalToken: order.principalToken,
            principalAmount: 0,
            expirationTimestamp: 0,
            maxLTV: 100,
        };

        const creditorCommitment: CreditorCommitment = {
            values,
            signature: this.blankSignature,
        };

        const principalPrice: Price = {
            value: 0,
            timestamp: 0,
            signature: this.blankSignature,
        };

        const collateralPrice: Price = {
            value: 0,
            timestamp: 0,
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

    commitmentHash(commitmentValues: CommitmentValues, order: DebtOrder): string {
        return this.web3.utils.soliditySha3(
            // LTV specific values.
            commitmentValues.maxLTV,
            commitmentValues.principalToken,
            commitmentValues.principalAmount,
            commitmentValues.expirationTimestamp,
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
}
