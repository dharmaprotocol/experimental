import BigNumber from "bignumber.js";
export interface SimpleInterestContractTerms {
    principalTokenIndex: number;
    principalAmount: number;
    interestRateFixedPoint: number;
    amortizationUnitType: number;
    termLengthUnits: number;
}
export interface CollateralizedContractTerms {
    collateralTokenIndex: number;
    collateralAmount: number;
    gracePeriodInDays: number;
}
declare class TermsContractParameters {
    static bitShiftLeft(target: number, numPlaces: number): BigNumber;
}
export declare class SimpleInterestParameters extends TermsContractParameters {
    static pack(terms: SimpleInterestContractTerms): string;
}
export declare class CollateralizedSimpleInterestTermsParameters extends TermsContractParameters {
    static pack(collateralTerms: CollateralizedContractTerms, contractTerms?: SimpleInterestContractTerms): string;
}
export {};
