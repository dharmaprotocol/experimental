import { BigNumber } from "../utils/bignumber";
export declare class TokenAmount {
    static fromRaw(rawAmount: BigNumber, symbol: string): TokenAmount;
    private static convertToRaw;
    private static convertToDecimal;
    readonly rawAmount: BigNumber;
    private readonly data;
    constructor(amount: number, symbol: string);
    readonly tokenNumDecimals: number;
    readonly tokenName: string;
    readonly tokenSymbol: string;
    readonly decimalAmount: number;
    toString(): string;
}
