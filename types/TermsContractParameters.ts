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
