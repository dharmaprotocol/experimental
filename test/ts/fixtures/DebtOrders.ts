import * as Web3 from "web3";
// Types
import { DebtOrder } from "../../../types/DebtOrder";
import {
    CollateralizedContractTerms,
    SimpleInterestContractTerms
} from "../../../types/TermsContractParameters";
import { ECDSASignature, ecSign } from "../../../types/ECDSASignature";
// Fixtures
import { CollateralizedSimpleInterestTermsParameters } from "./TermsContractParameters";

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

export class DebtOrderFixtures {
    readonly blankSignature: ECDSASignature = {
        r: this.web3.utils.fromAscii(""),
        s: this.web3.utils.fromAscii(""),
        v: 0
    };

    public amortizationUnitType: number = 1; // The amortization unit type (weekly)
    public collateralAmount: number = 1;
    public collateralTokenIndex: number = 1;
    public gracePeriodInDays: number = 0;
    public interestRateFixedPoint: number = 2.5 * 10 ** 4; // interest rate of 2.5%
    public principalAmount: number = 1; // principal of 1
    public principalTokenIndex: number = 0;
    public termLengthUnits: number = 4; // Term length in amortization units.

    constructor(
        private readonly web3: Web3,
        private readonly accounts: string[],
        private readonly tokens: Tokens,
        private readonly participants: Participants,
        private readonly contracts: Contracts,
    ) {
    }

    async unsignedOrder(): Promise<DebtOrder> {
        // The signatures will all be empty ECDSA signatures.
        const debtorSignature = this.blankSignature;
        const underwriterSignature = this.blankSignature;
        const creditorSignature = this.blankSignature;

        // Some time in seconds, defaulting to an hour past the current block's timestamp.
        const expirationTimestampInSec = (await this.currentBlockTimestamp()) + 3600;

        // Pack terms contract parameters
        const collateralizedContractTerms: CollateralizedContractTerms = {
            collateralAmount: this.collateralAmount, // collateral of 1
            collateralTokenIndex: this.collateralTokenIndex,
            gracePeriodInDays: this.gracePeriodInDays
        };
        const simpleInterestContractTerms: SimpleInterestContractTerms = {
            principalTokenIndex: this.principalTokenIndex,
            principalAmount: this.principalAmount, // principal of 1
            interestRateFixedPoint: this.interestRateFixedPoint, // interest rate of 2.5%
            amortizationUnitType: this.amortizationUnitType, // The amortization unit type (weekly)
            termLengthUnits: this.termLengthUnits // Term length in amortization units.
        };

        const termsContractParameters = CollateralizedSimpleInterestTermsParameters.pack(
            collateralizedContractTerms,
            simpleInterestContractTerms
        );

        return {
            kernelVersion: this.contracts.debtKernelAddress,
            issuanceVersion: this.contracts.repaymentRouterAddress,
            principalAmount: 1,
            principalToken: this.tokens.principalAddress,
            collateralAmount: 1,
            collateralToken: this.tokens.collateralAddress,
            debtor: this.participants.debtor,
            debtorFee: 0,
            creditor: this.participants.creditor,
            creditorFee: 0,
            relayer: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
            relayerFee: 0,
            underwriter: "0x0000000000000000000000000000000000000000",
            underwriterFee: 0,
            underwriterRiskRating: 0,
            termsContract: this.contracts.termsContractAddress,
            termsContractParameters,
            expirationTimestampInSec,
            salt: 0,
            debtorSignature,
            creditorSignature,
            underwriterSignature
        };
    }

    async signedOrder(): Promise<DebtOrder> {
        const unsignedOrder = await this.unsignedOrder();

        const commitmentHash = this.creditorHashForOrder(unsignedOrder);

        const creditorSignature = await ecSign(this.web3, commitmentHash, unsignedOrder.creditor);

        const debtorSignature = await ecSign(
            this.web3,
            this.debtorHashForOrder(unsignedOrder),
            unsignedOrder.debtor
        );

        return {
            ...unsignedOrder,
            creditorSignature,
            debtorSignature,
        };
    }

    creditorHashForOrder(order: DebtOrder): string {
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
            order.termsContractParameters
        );
    }

    debtorHashForOrder(order: DebtOrder): string {
        return this.web3.utils.soliditySha3(
            this.contracts.debtKernelAddress,
            this.getAgreementId(order),
            order.underwriterFee,
            order.principalAmount,
            order.principalToken,
            order.debtorFee,
            order.creditorFee,
            order.relayer,
            order.relayerFee,
            order.expirationTimestampInSec,
        );
    }

    getAgreementId(order: DebtOrder): string {
        return this.web3.utils.soliditySha3(
            this.contracts.debtKernelAddress, // version
            this.participants.debtor, // debtor
            "0x0000000000000000000000000000000000000000", // underwriter
            order.underwriterRiskRating,
            order.termsContract,
            order.termsContractParameters,
            order.salt,
        );
    }

    async currentBlockTimestamp(): Promise<number> {
        return (await this.web3.eth.getBlock("latest")).timestamp;
    }
}
