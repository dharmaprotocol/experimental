import { MaxLTVParams } from "../../../../../typescript/types";

export const VALID_MAX_LTV_LOAN_ORDER_PARAMS: MaxLTVParams = {
    collateralToken: "MKR",
    expiresInDuration: 5,
    expiresInUnit: "days",
    interestRate: 12.3,
    maxLTV: 50,
    maxPrincipalAmount: 100,
    priceProvider: "0x6385D458C76cd5360041245daA04df8F50d11A82",
    principalAmount: 100,
    principalToken: "REP",
    termDuration: 6,
    termUnit: "months"
};
