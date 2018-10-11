// External libraries
import * as chai from "chai";
import { BigNumber } from "bignumber.js";

import * as Web3 from "web3";

// Artifacts
const NaiveCreditorProxy = artifacts.require("./NaiveCreditorProxy.sol");

// Configuration
const expect = chai.expect;

export interface ECDSASignature {
    r: string;
    s: string;
    v: BigNumber;
}

interface DebtOrder {
    kernelVersion: string;
    issuanceVersion: string;
    principalAmount: BigNumber;
    principalToken: string;
    collateralAmount: BigNumber;
    collateralToken: string;
    debtor: string;
    debtorFee: BigNumber;
    creditor: string;
    creditorFee: BigNumber;
    relayer: string;
    relayerFee: BigNumber;
    underwriter: string;
    underwriterFee: BigNumber;
    underwriterRiskRating: BigNumber;
    termsContract: string;
    termsContractParameters: string;
    expirationTimestampInSec: BigNumber;
    salt: BigNumber;
    debtorSignature: ECDSASignature;
    creditorSignature: ECDSASignature;
    underwriterSignature: ECDSASignature;
};

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const proxy = new web3.eth.Contract(NaiveCreditorProxy.abi, NaiveCreditorProxy.address);

contract("NaiveCreditorProxy", (accounts) => {
    describe("#cancelDebtOffer", () => {
       describe("when the order has not been filled", () => {
           it("returns false", async() => {

               const testOrder: DebtOrder = {
                   kernelVersion: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                   issuanceVersion: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                   principalAmount: new BigNumber(0),
                   principalToken: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                   collateralAmount: new BigNumber(0),
                   collateralToken: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                   debtor: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                   debtorFee: new BigNumber(0),
                   creditor: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                   creditorFee: new BigNumber(0),
                   relayer: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                   relayerFee: new BigNumber(0),
                   underwriter: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                   underwriterFee: new BigNumber(0),
                   underwriterRiskRating: new BigNumber(0),
                   termsContract: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                   termsContractParameters: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                   expirationTimestampInSec: new BigNumber(0),
                   salt: new BigNumber(0),
                   debtorSignature: { r: "", s: "", v: new BigNumber(0) },
                   creditorSignature: { r: "", s: "", v: new BigNumber(0) },
                   underwriterSignature: { r: "", s: "", v: new BigNumber(0) },
               };

               // console.log(proxy.cancelDebtOffer.sendTransaction.getData());

               console.log(
                   "mappings!",
                   proxy.debtOfferCancelled
               );

               console.log(
                   "returns",
                   await proxy.debtOfferCancelled.call(
                       "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd"
                   ),
               );

               interface TestStruct {
                   test: boolean;
               }

               const test: TestStruct = {
                   test: true,
               };

               console.log(await proxy.testFunction.call(test));

               // await proxy.cancelDebtOffer.sendTransaction(
               //     { value: testOrder, from: testOrder.creditor },
               // );

               // expect(cancelled).to.eq(false);
           });
       })
    });
});
