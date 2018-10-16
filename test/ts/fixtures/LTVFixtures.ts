import * as Web3 from "web3";
// Types
import { DebtOrder } from "../../../types/DebtOrder";
import { ECDSASignature, ecSign } from "../../../types/ECDSASignature";
import { CommitmentValues, CreditorCommitment, LTVParams, Price } from "../../../types/LTVTypes";
import { DebtOrderFixtures } from "./DebtOrders";

interface Tokens {
    principalAddress: string;
    collateralAddress: string;
}

interface Participants {
    creditor: string;
    debtor: string;
}

interface Contracts {
    debtKernelAddress: string;
    repaymentRouterAddress: string;
    termsContractAddress: string;
}

export class LTVFixtures {
    readonly debtOrderFixtures: DebtOrderFixtures;

    readonly blankSignature: ECDSASignature = {
        r: this.web3.utils.fromAscii(""),
        s: this.web3.utils.fromAscii(""),
        v: 0
    };

    constructor(
        private readonly web3: Web3,
        private readonly accounts: string[],
        private readonly tokens: Tokens,
        private readonly participants: Participants,
        private readonly contracts: Contracts,
    ) {
        this.debtOrderFixtures = new DebtOrderFixtures(web3, accounts, tokens, participants, contracts);
    }

    async signedParams(): Promise<LTVParams> {
        const params = await this.unsignedParams();

        params.order = await this.debtOrderFixtures.signedOrder();

        const commitmentHash = this.commitmentHash(params.creditorCommitment.values, params.order);

        params.creditorCommitment.signature = await ecSign(this.web3, commitmentHash, params.creditor);

        const principalPriceHash = this.priceHash(params.principalPrice);
        const collateralPriceHash = this.priceHash(params.collateralPrice);

        params.priceFeedOperator = this.accounts[2];

        params.collateralPrice.signature = await ecSign(this.web3, collateralPriceHash, params.priceFeedOperator);

        params.principalPrice.signature = await ecSign(this.web3, principalPriceHash, params.priceFeedOperator);

        return params;
    }

    async unsignedParams(): Promise<LTVParams> {
        const order = await this.debtOrderFixtures.unsignedOrder();

        const values = {
            principalToken: order.principalToken,
            principalAmount: 1,
            maxLTV: 100
        };

        const creditorCommitment: CreditorCommitment = {
            values,
            signature: this.blankSignature
        };

        const principalPrice: Price = {
            value: 1,
            tokenAddress: this.tokens.principalAddress,
            timestamp: await this.currentBlockTimestamp(),
            signature: this.blankSignature
        };

        const collateralPrice: Price = {
            value: 20,
            tokenAddress: this.tokens.collateralAddress,
            timestamp: await this.currentBlockTimestamp(),
            signature: this.blankSignature
        };

        return {
            creditorCommitment,
            creditor: this.accounts[0],
            priceFeedOperator: this.accounts[1],
            principalPrice,
            collateralPrice,
            order
        };
    }

    priceHash(price: Price): string {
        return this.web3.utils.soliditySha3(price.value, price.tokenAddress, price.timestamp);
    }

    commitmentHash(commitmentValues: CommitmentValues, order: DebtOrder): string {
        return this.web3.utils.soliditySha3(
            order.creditor,
            order.kernelVersion,
            order.issuanceVersion,
            order.termsContract,
            order.principalToken,
            order.salt,
            order.principalAmount,
            order.creditorFee,
            order.expirationTimestampInSec,
            commitmentValues.maxLTV,
            // unpacked termsContractParameters
            this.web3.utils.soliditySha3(
                this.debtOrderFixtures.principalTokenIndex,
                this.debtOrderFixtures.principalAmount,
                this.debtOrderFixtures.interestRateFixedPoint,
                this.debtOrderFixtures.amortizationUnitType,
                this.debtOrderFixtures.termLengthUnits,
                this.debtOrderFixtures.collateralTokenIndex,
                this.debtOrderFixtures.gracePeriodInDays
            )
        );
    }

    async currentBlockTimestamp(): Promise<number> {
        return (await this.web3.eth.getBlock("latest")).timestamp;
    }
}
