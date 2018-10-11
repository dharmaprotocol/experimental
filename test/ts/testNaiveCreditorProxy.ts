// External libraries
import * as chai from "chai";
import * as Web3 from "web3";
// Types
import { DebtOrderFixtures } from "./fixtures/DebtOrders";
import { DebtOrder } from "./types/DebtOrder";

// Artifacts
const NaiveCreditorProxy = artifacts.require("./NaiveCreditorProxy.sol");

// Configuration
const expect = chai.expect;

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const proxy = new web3.eth.Contract(NaiveCreditorProxy.abi, NaiveCreditorProxy.address);

let debtOrderFixtures: DebtOrderFixtures;

contract("NaiveCreditorProxy", (accounts) => {
    before(() => {
        debtOrderFixtures = new DebtOrderFixtures(web3, accounts);
    });

    describe("#hashCreditorCommitmentForOrder", () => {
        describe("when given a valid order", () => {
            it("returns a bytes32 data type", async () => {
                const validOrder = await debtOrderFixtures.signedOrder();

                const result = await proxy.methods.hashCreditorCommitmentForOrder(
                    validOrder,
                ).call();

                expect(result).to.be.a("string");
            });
        });
    });

    describe("#fillDebtOffer", () => {
        describe("when given an unsigned debt offer", () => {
            let unsignedOrder: DebtOrder;
            let commitmentHash: string;

            before(async () => {
                unsignedOrder = debtOrderFixtures.unsignedOrder();

                commitmentHash = await proxy.methods.hashCreditorCommitmentForOrder(
                    unsignedOrder,
                ).call();
            });

            it("returns a transactionReceipt", async () => {
                const txReceipt = await proxy.methods.fillDebtOffer(unsignedOrder).send(
                    { from: unsignedOrder.creditor },
                );

                const txHash = txReceipt.transactionHash;

                // The transaction receipt is valid if it has a string transaction hash.
                expect(txHash).to.be.a("string");
            });

            it("does not add a mapping in the debtOfferFilled field", async () => {
                const result = await proxy.methods.debtOfferFilled(commitmentHash).call();

                expect(result).to.eq(false);
            });
        });

        describe("when given a signed debt order", () => {
            let signedOrder: DebtOrder;
            let commitmentHash: string;

            before(async () => {
                signedOrder = await debtOrderFixtures.signedOrder();

                commitmentHash = await proxy.methods.hashCreditorCommitmentForOrder(
                    signedOrder,
                ).call();
            });

            it("returns a transaction receipt", async () => {
                const txReceipt = await proxy.methods.fillDebtOffer(signedOrder).send(
                    { from: signedOrder.creditor },
                );

                const txHash = txReceipt.transactionHash;

                // The transaction receipt is valid if it has a string transaction hash.
                expect(txHash).to.be.a("string");
            });

            it("adds a mapping in the debtOfferFilled field", async () => {
                const result = await proxy.methods.debtOfferFilled(commitmentHash).call();

                expect(result).to.eq(true);
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
                const testOrder = debtOrderFixtures.signedOrder();

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
