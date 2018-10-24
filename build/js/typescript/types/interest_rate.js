"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_1 = require("../utils/bignumber");
class InterestRate {
    static fromRaw(value) {
        return new InterestRate(value.toNumber());
    }
    constructor(value) {
        this.percent = value;
        this.raw = new bignumber_1.BigNumber(value);
    }
}
exports.InterestRate = InterestRate;
//# sourceMappingURL=interest_rate.js.map