"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai = require("chai");
const types_1 = require("../../../../../typescript/types");
// Configuration
const expect = chai.expect;
const ltvCreditorProxyAddress = artifacts.require("./LTVCreditorProxy.sol").address;
function testSignAsCreditor(web3, params) {
    return __awaiter(this, void 0, void 0, function* () {
        describe("passing valid params", () => {
            let creditor;
            let loanOffer;
            beforeEach(() => __awaiter(this, void 0, void 0, function* () {
                const accounts = yield web3.eth.getAccounts();
                creditor = accounts[0];
                loanOffer = yield types_1.MaxLTVLoanOffer.create(ltvCreditorProxyAddress, web3, params);
            }));
            it("signs the offer as the creditor", () => __awaiter(this, void 0, void 0, function* () {
                const isSignedByCreditorBefore = loanOffer.isSignedByCreditor();
                expect(isSignedByCreditorBefore).equal(false);
                yield loanOffer.signAsCreditor(creditor);
                const isSignedByCreditorAfter = loanOffer.isSignedByCreditor();
                expect(isSignedByCreditorAfter).equal(true);
            }));
        });
    });
}
exports.testSignAsCreditor = testSignAsCreditor;
//# sourceMappingURL=sign_as_creditor.js.map