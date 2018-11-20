import { DebtOrder } from "./DebtOrder";
import { ECDSASignature } from "./ECDSASignature";
export interface CommitmentValues {
    maxLTV: number | string;
}
export interface CreditorCommitment {
    values: CommitmentValues;
    signature: ECDSASignature;
}
export interface Price {
    value: number;
    tokenAddress: string;
    timestamp: number;
    signature: ECDSASignature;
}
export interface LTVParams {
    creditor: string;
    priceFeedOperator: string;
    creditorCommitment: CreditorCommitment;
    principalPrice: Price;
    collateralPrice: Price;
    order: DebtOrder;
}
