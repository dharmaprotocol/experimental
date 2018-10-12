import * as Web3 from "web3";
// Types
import { DebtOrder } from "../types/DebtOrder";
import { ECDSASignature } from "../types/ECDSASignature";
import {
    CommitmentValues,
    CreditorCommitment,
    LTVParams,
    Price
} from "../types/LTVDecisionEngineTypes";
import { DebtOrderFixtures } from "./DebtOrders";

export class LTVParamsFixtures {
    readonly debtOrderFixtures: DebtOrderFixtures;

    readonly blankSignature: ECDSASignature = {
        r: this.web3.utils.fromAscii(""),
        s: this.web3.utils.fromAscii(""),
        v: 0,
    };

    constructor(private readonly web3: Web3, private readonly accounts: string[]) {
        this.debtOrderFixtures = new DebtOrderFixtures(web3, accounts);
    }

    unsignedParams(): LTVParams {
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
            order: this.debtOrderFixtures.unsignedOrder,
        };
    }
}
