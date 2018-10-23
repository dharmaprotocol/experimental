import * as chai from "chai";
import * as Web3 from "web3";

import { MaxLTVLoanOffer, MaxLTVParams } from "../../../../../typescript/types";

const ltvCreditorProxyAddress = artifacts.require("./LTVCreditorProxy.sol").address;

// Configuration
const expect = chai.expect;

export function testConstructor(web3: Web3, params: MaxLTVParams) {
    describe("passing valid params", () => {
        let loanOffer: MaxLTVLoanOffer;

        beforeEach(async () => {
            loanOffer = await MaxLTVLoanOffer.create(ltvCreditorProxyAddress, web3, params);
        });

        it("returns a MaxLTVLoanOffer", () => {
            expect(loanOffer).to.be.an.instanceof(MaxLTVLoanOffer);
        });

        it("not signed by the debtor", () => {
            const isSignedByDebtor = loanOffer.isSignedByDebtor();

            expect(isSignedByDebtor).equal(false);
        });

        it("not signed by the creditor", () => {
            const isSignedByCreditor = loanOffer.isSignedByCreditor();

            expect(isSignedByCreditor).equal(false);
        });
    });
}
