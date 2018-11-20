import { MaxLTVParams } from "../../../../../typescript/types";

export const VALID_MAX_LTV_LOAN_ORDER_PARAMS: MaxLTVParams = {
    collateralToken: "MKR",
    expiresInDuration: 5,
    expiresInUnit: "days",
    interestRate: 12.3,
    maxLTV: 50,
    priceProvider: "0x6385d458c76cd5360041245daa04df8f50d11a82",
    principalAmount: 100,
    principalToken: "REP",
    termDuration: 6,
    termUnit: "months",
};
