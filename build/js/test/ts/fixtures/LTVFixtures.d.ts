import * as Web3 from "web3";
import { DebtOrder } from "../../../types/DebtOrder";
import { ECDSASignature } from "../../../types/ECDSASignature";
import { CommitmentValues, LTVParams, Price } from "../../../types/LTVTypes";
import { DebtOrderFixtures } from "./DebtOrders";
interface Tokens {
    principalAddress: string;
    collateralAddress: string;
}
interface Participants {
    creditor: string;
    debtor: string;
}
interface Contracts {
    debtKernelAddress: string;
    repaymentRouterAddress: string;
    termsContractAddress: string;
}
export declare class LTVFixtures {
    private readonly web3;
    private readonly accounts;
    private readonly tokens;
    private readonly participants;
    private readonly contracts;
    readonly debtOrderFixtures: DebtOrderFixtures;
    readonly blankSignature: ECDSASignature;
    constructor(web3: Web3, accounts: string[], tokens: Tokens, participants: Participants, contracts: Contracts);
    signedParams(): Promise<LTVParams>;
    unsignedParams(): Promise<LTVParams>;
    priceHash(price: Price): string;
    commitmentHash(commitmentValues: CommitmentValues, order: DebtOrder): string;
    currentBlockTimestamp(): Promise<number>;
}
export {};
