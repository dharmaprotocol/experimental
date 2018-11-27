// Types
import { DebtOrder } from "./DebtOrder";
import { ECDSASignature } from "./ECDSASignature";

// The set of values that the creditor signs.
export interface CommitmentValues {
    maxLTV: number | string;
    // The price feed operator's address .
    priceFeedOperator: string;
}

// The combination of signed values and signature .
export interface CreditorCommitment {
    values: CommitmentValues;
    signature: ECDSASignature;
}

// A price signed by the feed operator.
export interface Price {
    value: number;
    tokenAddress: string;
    timestamp: number;
    signature: ECDSASignature;
}

// The parameters that must be passed to the proxy contract.
export interface LTVParams {
    // The creditor's address.
    creditor: string;

    // The values and signature for the creditor commitment hash.
    creditorCommitment: CreditorCommitment;
    // Price feed data.
    principalPrice: Price;
    collateralPrice: Price;
    // A DebtOrderData is required to confirm parity with the submitted order.
    order: DebtOrder;
}
