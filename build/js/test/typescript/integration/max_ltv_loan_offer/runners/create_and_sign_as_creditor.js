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
const ltvCreditorProxyAddress = artifacts.require("./LTVCreditorProxy.sol").address;
// Configuration
const expect = chai.expect;
function testCreateAndSignAsCreditor(web3, params) {
    return __awaiter(this, void 0, void 0, function* () {
        describe("passing valid params", () => {
            let loanOffer;
            beforeEach(() => __awaiter(this, void 0, void 0, function* () {
                const accounts = yield web3.eth.getAccounts();
                const creditor = accounts[0];
                loanOffer = yield types_1.MaxLTVLoanOffer.createAndSignAsCreditor(ltvCreditorProxyAddress, web3, params, creditor);
            }));
            it("returns a MaxLTVLoanOffer", () => {
                expect(loanOffer).to.be.an.instanceof(types_1.MaxLTVLoanOffer);
            });
            it("not signed by the debtor", () => {
                const isSignedByDebtor = loanOffer.isSignedByDebtor();
                expect(isSignedByDebtor).equal(false);
            });
            it("is signed by the creditor", () => {
                const isSignedByCreditor = loanOffer.isSignedByCreditor();
                expect(isSignedByCreditor).equal(true);
            });
        });
    });
}
exports.testCreateAndSignAsCreditor = testCreateAndSignAsCreditor;
//# sourceMappingURL=create_and_sign_as_creditor.js.map