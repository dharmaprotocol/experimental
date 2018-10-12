import { ECDSASignature } from "./ECDSASignature";

export interface DebtOrder {
    kernelVersion: string;
    issuanceVersion: string;
    principalAmount: number;
    principalToken: string;
    collateralAmount: number;
    collateralToken: string;
    debtor: string;
    debtorFee: number;
    creditor: string;
    creditorFee: number;
    relayer: string;
    relayerFee: number;
    underwriter: string;
    underwriterFee: number;
    underwriterRiskRating: number;
    termsContract: string;
    termsContractParameters: string;
    expirationTimestampInSec: number;
    salt: number;
    debtorSignature: ECDSASignature;
    creditorSignature: ECDSASignature;
    underwriterSignature: ECDSASignature;
}
