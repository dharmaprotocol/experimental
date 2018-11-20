import { ECDSASignature } from "./ECDSASignature";
export interface DebtOrder {
    kernelVersion: string;
    issuanceVersion: string;
    principalAmount: number | string;
    principalToken: string;
    collateralAmount: number | string;
    collateralToken: string;
    debtor: string;
    debtorFee: number | string;
    creditor: string;
    creditorFee: number | string;
    relayer: string;
    relayerFee: number | string;
    underwriter: string;
    underwriterFee: number | string;
    underwriterRiskRating: number | string;
    termsContract: string;
    termsContractParameters: string;
    expirationTimestampInSec: number | string;
    salt: number | string;
    debtorSignature: ECDSASignature;
    creditorSignature: ECDSASignature;
    underwriterSignature: ECDSASignature;
}
