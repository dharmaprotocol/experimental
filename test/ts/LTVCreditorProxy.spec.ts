// External libraries
import * as chai from "chai";
import * as Web3 from "web3";
// Types
import { DebtOrderFixtures } from "./fixtures/DebtOrders";
import { CommitmentValues, CreditorCommitment, LTVParams, Price } from "../../types/LTVTypes";
import { DebtOrder } from "../../types/DebtOrder";
import { LTVFixtures } from "./fixtures/LTVFixtures";

// Artifacts
const LTVCreditorProxy = artifacts.require("./LTVCreditorProxy.sol");

// Configuration
const expect = chai.expect;

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const proxy = new web3.eth.Contract(LTVCreditorProxy.abi, LTVCreditorProxy.address);

let debtOrderFixtures: DebtOrderFixtures;
let lTVFixtures: LTVFixtures;

contract("LTVCreditorProxy", accounts => {
    before(() => {
        debtOrderFixtures = new DebtOrderFixtures(web3, accounts);
        lTVFixtures = new LTVFixtures(web3, accounts);
    });

    describe("#hashOrder", () => {
        describe("when given commitment values and a debt order", () => {
            it("returns the expected bytes32 hash", async () => {
                const params = await lTVFixtures.unsignedParams();
                const order = await debtOrderFixtures.unsignedOrder();
                const commitmentValues = params.creditorCommitment.values;

                const expected = await lTVFixtures.commitmentHash(commitmentValues, order);

                const result = await proxy.methods.hashOrder(commitmentValues, order).call();

                expect(result).to.eq(expected);
            });
        });
    });

    describe("when given params that are signed by the creditor but not the price feed operator", () => {
        // STUB.
    });

    describe("when given params that are signed by the creditor and the price feed operator", () => {
        let order: DebtOrder;
        let commitmentHash: string;
        let params: LTVParams;

        before(async () => {
            params = await lTVFixtures.signedParams();
            order = params.order;

            commitmentHash = await proxy.methods.hashOrder(params.creditorCommitment.values, order).call();
        });

        it("returns a transaction receipt", async () => {
            const txReceipt = await proxy.methods.fillDebtOffer(params).send({
                from: params.creditor,
                gas: 6712390
            });

            const txHash = txReceipt.transactionHash;

            // The transaction receipt is valid if it has a string transaction hash.
            expect(txHash).to.be.a("string");
        });

        it("adds a mapping in the debtOfferFilled field", async () => {
            const result = await proxy.methods.debtOfferFilled(commitmentHash).call();

            expect(result).to.eq(true);
        });
    });

    describe("when the commitment values were not signed", () => {
        let unsignedOrder: DebtOrder;
        let commitmentHash: string;

        before(async () => {
            const params = await lTVFixtures.unsignedParams();

            unsignedOrder = params.order;

            commitmentHash = await proxy.methods.hashOrder(params.creditorCommitment.values, unsignedOrder).call();
        });

        it("returns a transaction receipt", async () => {
            const values: CommitmentValues = { maxLTV: 100 };

            const creditorCommitment: CreditorCommitment = {
                values,
                signature: debtOrderFixtures.blankSignature
            };

            const principalPrice: Price = {
                value: 0,
                tokenAddress: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                timestamp: 0,
                signature: debtOrderFixtures.blankSignature
            };

            const collateralPrice: Price = {
                value: 0,
                tokenAddress: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                timestamp: 0,
                signature: debtOrderFixtures.blankSignature
            };

            const params: LTVParams = {
                creditorCommitment,
                creditor: accounts[0],
                priceFeedOperator: accounts[1],
                principalPrice,
                collateralPrice,
                order: unsignedOrder
            };

            const transactionReceipt = await proxy.methods.fillDebtOffer(params).send({
                from: unsignedOrder.creditor
            });

            expect(transactionReceipt.transactionHash).to.be.a("string");
        });

        it("does not add a mapping in the debtOfferFilled field", async () => {
            const result = await proxy.methods.debtOfferFilled(commitmentHash).call();

            expect(result).to.eq(false);
        });
    });
});
