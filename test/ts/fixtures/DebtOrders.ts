import * as Web3 from "web3";

// Types
import { DebtOrder } from "../../../types/DebtOrder";
import { SimpleInterestContractTerms, CollateralizedContractTerms } from "../../../types/TermsContractParameters";
import { ECDSASignature, ecSign } from "../../../types/ECDSASignature";

// Fixtures
import { CollateralizedSimpleInterestTermsParameters } from "./TermsContractParameters";

export class DebtOrderFixtures {
    readonly blankSignature: ECDSASignature = {
        r: this.web3.utils.fromAscii(""),
        s: this.web3.utils.fromAscii(""),
        v: 0
    };

    public amortizationUnitType: number = 1; // The amortization unit type (weekly)
    public collateralAmount: number = 1 * 10 ** 18;
    public collateralTokenIndex: number = 1;
    public gracePeriodInDays: number = 0;
    public interestRateFixedPoint: number = 2.5 * 10 ** 4; // interest rate of 2.5%
    public principalAmount: number = 1 * 10 ** 18; // principal of 1
    public principalTokenIndex: number = 0;
    public termLengthUnits: number = 4; // Term length in amortization units.

    constructor(private readonly web3: Web3, private readonly accounts: string[]) {}

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
            kernelVersion: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
            issuanceVersion: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
            principalAmount: 1,
            principalToken: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
            collateralAmount: 1,
            collateralToken: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
            debtor: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
            debtorFee: 0,
            creditor: this.accounts[0],
            creditorFee: 0,
            relayer: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
            relayerFee: 0,
            underwriter: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
            underwriterFee: 0,
            underwriterRiskRating: 0,
            termsContract: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
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

        const commitmentHash = this.hashForOrder(unsignedOrder);

        const creditorSignature = await ecSign(this.web3, commitmentHash, unsignedOrder.creditor);

        return {
            ...unsignedOrder,
            creditorSignature
        };
    }

    hashForOrder(order: DebtOrder): string {
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

    async currentBlockTimestamp(): Promise<number> {
        return (await this.web3.eth.getBlock("latest")).timestamp;
    }
}
