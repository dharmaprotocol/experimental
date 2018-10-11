// External libraries
import * as chai from "chai";
import * as Web3 from "web3";
// Types
import { DebtOrderFixtures } from "./fixtures/DebtOrders";
import { DebtOrder } from "./types/DebtOrder";
import {
    CommitmentValues,
    CreditorCommitment,
    LTVParams,
    Price
} from "./types/LTVDecisionEngineTypes";

// Artifacts
const LTVCreditorProxy = artifacts.require("./LTVCreditorProxy.sol");

// Configuration
const expect = chai.expect;

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const proxy = new web3.eth.Contract(LTVCreditorProxy.abi, LTVCreditorProxy.address);

let debtOrderFixtures: DebtOrderFixtures;

contract("LTVCreditorProxy", (accounts) => {
    before(() => {
        debtOrderFixtures = new DebtOrderFixtures(web3, accounts);
    });

    describe("when the commitment values were not signed", () => {
        it ("returns a transaction receipt", async () => {
            const values: CommitmentValues = {
                principalToken: "0x",
                principalAmount: 0,
                expirationTimestamp: 0,
                maxLTV: 100,
            };

            const creditorCommitment: CreditorCommitment = {
                values,
                signature: debtOrderFixtures.blankSignature,
            };

            const principalPrice: Price = {
                value: 0,
                timestamp: 0,
                signature: debtOrderFixtures.blankSignature,
            };

            const collateralPrice: Price = {
                value: 0,
                timestamp: 0,
                signature: debtOrderFixtures.blankSignature,
            };

            const unsignedOrder = debtOrderFixtures.unsignedOrder;

            const params: LTVParams = {
                creditorCommitment,
                creditor: accounts[0],
                priceFeedOperator: accounts[1],
                principalPrice,
                collateralPrice,
                order: unsignedOrder,
            };

            const transactionReceipt = await proxy.methods.fillDebtOffer(params).send(
                {
                    from: unsignedOrder.creditor,
                }
            );

            expect(transactionReceipt.transactionHash).to.be.a("string");
        });
    });
});
