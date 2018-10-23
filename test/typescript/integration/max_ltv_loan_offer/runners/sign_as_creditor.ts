import * as chai from "chai";
import * as Web3 from "web3";

import { MaxLTVLoanOffer, MaxLTVParams } from "../../../../../typescript/types";

// Configuration
const expect = chai.expect;

const ltvCreditorProxyAddress = artifacts.require("./LTVCreditorProxy.sol").address;

export async function testSignAsCreditor(web3: Web3, params: MaxLTVParams) {
    describe("passing valid params", () => {
        let creditor: string;
        let loanOffer: MaxLTVLoanOffer;

        beforeEach(async () => {
            const accounts = await web3.eth.getAccounts();
            creditor = accounts[0];

            loanOffer = await MaxLTVLoanOffer.create(ltvCreditorProxyAddress, web3, params);
        });

        it("signs the offer as the creditor", async () => {
            const isSignedByCreditorBefore = loanOffer.isSignedByCreditor();
            expect(isSignedByCreditorBefore).equal(false);

            await loanOffer.signAsCreditor(creditor);

            const isSignedByCreditorAfter = loanOffer.isSignedByCreditor();
            expect(isSignedByCreditorAfter).equal(true);
        });
    });
}
