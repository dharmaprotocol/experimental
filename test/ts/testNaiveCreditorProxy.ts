// External libraries
import * as chai from "chai";
import * as Web3 from "web3";
// Types
import { DebtOrder } from "./types/DebtOrder";
import { DebtOrderFixtures } from "./fixtures/DebtOrders";

// Artifacts
const NaiveCreditorProxy = artifacts.require("./NaiveCreditorProxy.sol");

// Configuration
const expect = chai.expect;

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const proxy = new web3.eth.Contract(NaiveCreditorProxy.abi, NaiveCreditorProxy.address);

const debtOrderFixtures = new DebtOrderFixtures(web3);

contract("NaiveCreditorProxy", (accounts) => {
    describe("#hashCreditorCommitmentForOrder", () => {
        describe("when given a valid order", () => {
            it("returns a bytes32 data type", async () => {
                const validOrder = debtOrderFixtures.validOrder();

                const result = await proxy.methods.hashCreditorCommitmentForOrder(
                    validOrder,
                ).call();
                
                expect(result).to.be.a("string");
            });
        });
    });

    describe("#fillDebtOffer", () => {
        describe("when given valid arguments for a debt offer", () => {
            it("returns a transaction receipt", () => {
                // STUB.
            });

            it("sets the index of the debtOfferFilled mapping for the hash of the offer to true", () => {
                // STUB.
            });
        });
    });

    describe("when no order has been filled", () => {
        describe("#debtOfferFilled", () => {
            it("returns false for some given bytes32 argument", async () => {
                const bytes32String = web3.utils.fromAscii("test");
                const result = await proxy.methods.debtOfferFilled(bytes32String).call();

                expect(result).to.eq(false);
            });
        });

        describe("#cancelDebtOffer", () => {
            let txReceipt;

            it("returns a transaction receipt", async () => {
                const testOrder = debtOrderFixtures.validOrder();

                txReceipt = await proxy.methods.cancelDebtOffer(testOrder).send(
                    { from: accounts[0] }
                );

                const txHash = txReceipt.transactionHash;
                // The transaction receipt is valid if it has a string transaction hash.
                expect(txHash).to.be.a("string");
            });
        });
    });
});
