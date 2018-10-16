// External Libraries
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import * as Web3 from "web3";
import * as addressBook from "dharma-address-book";

// Artifacts
const TokenRegistry = artifacts.require("./TokenRegistry.sol");

// Types
import { Price } from "../../../../../types/LTVTypes";
import { ecSign, ECDSASignature } from "../../../../../types/ECDSASignature";
import { MAX_LTV_LOAN_OFFER_ERRORS, MaxLTVLoanOffer, MaxLTVParams } from "../../../../../typescript/types";

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

export async function testSignAsDebtor(web3: Web3, params: MaxLTVParams) {
    const tokenRegistry = new web3.eth.Contract(TokenRegistry.abi, addresses.TokenRegistry);

    describe("passing valid params", () => {
        const priceProvider = params.priceProvider;

        let creditor: string;
        let debtor: string;
        let loanOffer: MaxLTVLoanOffer;

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

        beforeEach(async () => {
            const accounts = await web3.eth.getAccounts();

            creditor = accounts[0];
            debtor = accounts[1];

            loanOffer = await MaxLTVLoanOffer.create(web3, params);
        });

        it("signs the offer as the debtor if all prerequisites are met", async () => {
            const isSignedByDebtorBefore = loanOffer.isSignedByDebtor();
            expect(isSignedByDebtorBefore).equal(false);

            await loanOffer.signAsCreditor(creditor);

            await setPrices();

            loanOffer.setCollateralAmount(160);

            await loanOffer.signAsDebtor(debtor);

            const isSignedByDebtorAfter = loanOffer.isSignedByDebtor();
            expect(isSignedByDebtorAfter).equal(true);
        });

        describe("should throw", () => {
            it("when the debtor has already signed", async () => {
                const isSignedByDebtorBefore = loanOffer.isSignedByDebtor();
                expect(isSignedByDebtorBefore).equal(false);

                await loanOffer.signAsCreditor(creditor);

                await setPrices();

                loanOffer.setCollateralAmount(160);

                await loanOffer.signAsDebtor(debtor);

                expect(loanOffer.signAsDebtor(debtor)).to.eventually.be.rejectedWith(
                    MAX_LTV_LOAN_OFFER_ERRORS.ALREADY_SIGNED_BY_DEBTOR()
                );
            });

            it("when prices are not set", async () => {
                const isSignedByDebtorBefore = loanOffer.isSignedByDebtor();
                expect(isSignedByDebtorBefore).equal(false);

                await loanOffer.signAsCreditor(creditor);

                loanOffer.setCollateralAmount(160);

                expect(loanOffer.signAsDebtor(debtor)).to.eventually.be.rejectedWith(
                    MAX_LTV_LOAN_OFFER_ERRORS.PRICES_NOT_SET()
                );
            });

            it("when the collateral amount is not set", async () => {
                const isSignedByDebtorBefore = loanOffer.isSignedByDebtor();
                expect(isSignedByDebtorBefore).equal(false);

                await loanOffer.signAsCreditor(creditor);

                await setPrices();

                expect(loanOffer.signAsDebtor(debtor)).to.eventually.be.rejectedWith(
                    MAX_LTV_LOAN_OFFER_ERRORS.COLLATERAL_AMOUNT_NOT_SET()
                );
            });

            it("when the collateral amount is insufficient", async () => {
                const isSignedByDebtorBefore = loanOffer.isSignedByDebtor();
                expect(isSignedByDebtorBefore).equal(false);

                await loanOffer.signAsCreditor(creditor);

                const collateralAmount = 10;

                loanOffer.setCollateralAmount(collateralAmount);

                await setPrices();

                expect(loanOffer.signAsDebtor(debtor)).to.eventually.be.rejectedWith(
                    MAX_LTV_LOAN_OFFER_ERRORS.INSUFFICIENT_COLLATERAL_AMOUNT(collateralAmount, params.collateralToken)
                );
            });
        });
    });
}
