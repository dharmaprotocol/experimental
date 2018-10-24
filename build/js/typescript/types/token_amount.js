"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Utils
const bignumber_1 = require("../utils/bignumber");
const constants_1 = require("../utils/constants");
function registryDataForSymbol(symbol) {
    const registryData = constants_1.TOKEN_REGISTRY_TRACKED_TOKENS.find(tokenObject => tokenObject.symbol === symbol);
    if (!registryData) {
        throw new Error("Cannot find token with given symbol in token registry");
    }
    return {
        symbol,
        numDecimals: new bignumber_1.BigNumber(registryData.decimals),
        name: registryData.name
    };
}
class TokenAmount {
    static fromRaw(rawAmount, symbol) {
        const { numDecimals } = registryDataForSymbol(symbol);
        const decimalAmount = TokenAmount.convertToDecimal(rawAmount, numDecimals);
        return new TokenAmount(decimalAmount, symbol);
    }
    static convertToRaw(decimalAmount, numDecimals) {
        return decimalAmount.mul(new bignumber_1.BigNumber(10).pow(numDecimals.toNumber()));
    }
    static convertToDecimal(rawAmount, numDecimals) {
        return rawAmount.div(new bignumber_1.BigNumber(10).pow(numDecimals.toNumber())).toNumber();
    }
    constructor(amount, symbol) {
        this.data = registryDataForSymbol(symbol);
        this.rawAmount = TokenAmount.convertToRaw(new bignumber_1.BigNumber(amount.toString()), this.data.numDecimals);
    }
    get tokenNumDecimals() {
        return this.data.numDecimals.toNumber();
    }
    get tokenName() {
        return this.data.name;
    }
    get tokenSymbol() {
        return this.data.symbol;
    }
    get decimalAmount() {
        return TokenAmount.convertToDecimal(this.rawAmount, this.data.numDecimals);
    }
    toString() {
        return `${this.decimalAmount} ${this.data.symbol}`;
    }
}
exports.TokenAmount = TokenAmount;
//# sourceMappingURL=token_amount.js.map