import * as Web3 from "web3";
import { DebtOrder } from "../../../types/DebtOrder";
import { ECDSASignature } from "../../../types/ECDSASignature";
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
export declare class DebtOrderFixtures {
    private readonly web3;
    private readonly accounts;
    private readonly tokens;
    private readonly participants;
    private readonly contracts;
    readonly blankSignature: ECDSASignature;
    amortizationUnitType: number;
    collateralAmount: number;
    collateralTokenIndex: number;
    gracePeriodInDays: number;
    interestRateFixedPoint: number;
    principalAmount: number;
    principalTokenIndex: number;
    termLengthUnits: number;
    constructor(web3: Web3, accounts: string[], tokens: Tokens, participants: Participants, contracts: Contracts);
    unsignedOrder(): Promise<DebtOrder>;
    signedOrder(): Promise<DebtOrder>;
    creditorHashForOrder(order: DebtOrder): string;
    debtorHashForOrder(order: DebtOrder): string;
    getAgreementId(order: DebtOrder): string;
    currentBlockTimestamp(): Promise<number>;
}
export {};
