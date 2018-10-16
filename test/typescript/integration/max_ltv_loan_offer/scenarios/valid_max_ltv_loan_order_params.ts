import { MaxLTVParams } from "../../../../../typescript/types";

export const VALID_MAX_LTV_LOAN_ORDER_PARAMS: MaxLTVParams = {
    collateralToken: "MKR",
    expiresInDuration: 5,
    expiresInUnit: "days",
    interestRate: 12.3,
    maxLTV: 50,
    priceProvider: "0x14978f69aAAf6252ce62d6d50ED36130BD18aC43",
    principalAmount: 10,
    principalToken: "REP",
    termDuration: 6,
    termUnit: "months"
};
