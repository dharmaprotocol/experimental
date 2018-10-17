// External Libraries
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as Web3 from "web3";
import * as addressBook from "dharma-address-book";
import BigNumber from "bignumber.js";

// Artifacts
const LTVCreditorProxy = artifacts.require("./lTVCreditorProxy.sol");
const TokenRegistry = artifacts.require("./TokenRegistry.sol");
const DummyToken = artifacts.require("./DummyToken.sol");
const DebtKernel = artifacts.require("./DebtKernelInterface.sol");

// Types
import { Price } from "../../../../../types/LTVTypes";
import { ecSign, ECDSASignature } from "../../../../../types/ECDSASignature";
import { MAX_LTV_LOAN_OFFER_ERRORS, MaxLTVLoanOffer, MaxLTVParams } from "../../../../../typescript/types";

// Utils
import SnapshotManager from "../../../../ts/helpers/SnapshotManager";

// Configuration
chai.use(chaiAsPromised);
const expect = chai.expect;

const addresses = addressBook.latest.development;

async function generateSignedPrice(
    web3: Web3,
    priceProviderAddress: string,
    value: number,
    tokenAddress: string,
    timestamp: number
): Promise<Price> {
    const priceHash = web3.utils.soliditySha3(value, tokenAddress, timestamp);

    const signature = await ecSign(web3, priceHash, priceProviderAddress);

    return { value, tokenAddress, timestamp, signature };
}

export async function testAcceptAsDebtor(web3: Web3, params: MaxLTVParams) {
    const snapshotManager = new SnapshotManager(web3);

    const tokenRegistry = new web3.eth.Contract(TokenRegistry.abi, addresses.TokenRegistry);

    describe("passing valid params", () => {
        const priceProvider = params.priceProvider;

        let creditor: string;
        let debtor: string;
        let loanOffer: MaxLTVLoanOffer;
        let snapshotId: number;

        async function setPrices() {
            const principalTokenAddress = await tokenRegistry.methods
                .getTokenAddressBySymbol(params.principalToken)
                .call();
            const collateralTokenAddress = await tokenRegistry.methods
                .getTokenAddressBySymbol(params.collateralToken)
                .call();

            const principalPrice = await generateSignedPrice(
                web3,
                priceProvider,
                10,
                principalTokenAddress,
                Math.round(Date.now() / 1000)
            );
            const collateralPrice = await generateSignedPrice(
                web3,
                priceProvider,
                10,
                collateralTokenAddress,
                Math.round(Date.now() / 1000)
            );

            loanOffer.setPrincipalPrice(principalPrice);
            loanOffer.setCollateralPrice(collateralPrice);
        }

        const setupBalancesAndAllowances = async (): Promise<void> => {
            const principalTokenAddress = await tokenRegistry.methods
                .getTokenAddressBySymbol(params.principalToken)
                .call();
            const collateralTokenAddress = await tokenRegistry.methods
                .getTokenAddressBySymbol(params.collateralToken)
                .call();

            const principalToken = new web3.eth.Contract(DummyToken.abi, principalTokenAddress);
            const collateralToken = new web3.eth.Contract(DummyToken.abi, collateralTokenAddress);

            await principalToken.methods
                .setBalance(creditor, new BigNumber(10000000000000000000000).toString())
                .send({ from: creditor });

            await principalToken.methods
                .approve(LTVCreditorProxy.address, new BigNumber(10000000000000000000000).toString())
                .send({ from: creditor });

            await collateralToken.methods
                .setBalance(debtor, new BigNumber(10000000000000000000000).toString())
                .send({ from: creditor });

            await collateralToken.methods
                .approve(addresses.TokenTransferProxy, new BigNumber(10000000000000000000000).toString())
                .send({ from: debtor });
        };

        before(async () => {
            snapshotId = await snapshotManager.saveTestSnapshot();
        });

        after(async () => {
            await snapshotManager.revertToSnapshot(snapshotId);
        });

        beforeEach(async () => {
            const accounts = await web3.eth.getAccounts();

            creditor = accounts[0];
            debtor = accounts[1];

            await setupBalancesAndAllowances();

            loanOffer = await MaxLTVLoanOffer.create(web3, params);
        });

        it("accepts the offer as the debtor if all prerequisites are met", async () => {
            await loanOffer.signAsCreditor(creditor);

            await setPrices();

            loanOffer.setCollateralAmount(210);

            await loanOffer.signAsDebtor(debtor);

            await loanOffer.acceptAsDebtor();

            const isAccepted = await loanOffer.isAccepted();

            expect(isAccepted).equal(true);
        });
    });
}
