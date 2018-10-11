// External libraries
import * as chai from "chai";
import { BigNumber } from "bignumber.js";
import * as Web3 from "web3";

// Artifacts
const NaiveCreditorProxy = artifacts.require("./NaiveCreditorProxy.sol");

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const proxy = new web3.eth.Contract(NaiveCreditorProxy.abi, NaiveCreditorProxy.address);

// Configuration
const expect = chai.expect;

export interface ECDSASignature {
    r: string;
    s: string;
    v: number;
}

interface DebtOrder {
    kernelVersion: string;
    issuanceVersion: string;
    principalAmount: number;
    principalToken: string;
    collateralAmount: number;
    collateralToken: string;
    debtor: string;
    debtorFee: number;
    creditor: string;
    creditorFee: number;
    relayer: string;
    relayerFee: number;
    underwriter: string;
    underwriterFee: number;
    underwriterRiskRating: number;
    termsContract: string;
    termsContractParameters: string;
    expirationTimestampInSec: number;
    salt: number;
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
                   principalAmount: 0,
                   principalToken: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                   collateralAmount: 0,
                   collateralToken: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                   debtor: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                   debtorFee: 0,
                   creditor: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                   creditorFee: 0,
                   relayer: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                   relayerFee: 0,
                   underwriter: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                   underwriterFee: 0,
                   underwriterRiskRating: 0,
                   termsContract: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                   termsContractParameters: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                   expirationTimestampInSec: 0,
                   salt: 0,
                   debtorSignature: { r: web3.utils.fromAscii(""), s: web3.utils.fromAscii(""), v: 0 },
                   creditorSignature: { r: web3.utils.fromAscii(""), s: web3.utils.fromAscii(""), v: 0 },
                   underwriterSignature: { r: web3.utils.fromAscii(""), s: web3.utils.fromAscii(""), v: 0 },
               };

               // console.log(proxy.cancelDebtOffer.sendTransaction.getData());

               // console.log(
               //     "mappings!",
               //     proxy.debtOfferCancelled
               // );
               //
               // console.log(
               //     "returns",
               //     await proxy.debtOfferCancelled.call(
               //         "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd"
               //     ),
               // );

               interface TestStruct {
                   test: boolean;
               }

               const test: TestStruct = {
                   test: true,
               };

               console.log(
                   await proxy.methods.testFunction(test).call(),
               );

               // console.log(await proxy.testFunction.call(test));

               const result = await proxy.methods.cancelDebtOffer(testOrder).send({ from: accounts[0] });

               console.log(result);

               // expect(cancelled).to.eq(false);
           });
       })
    });
});
