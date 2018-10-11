import * as Web3 from "web3";

import { DebtOrder } from "../types/DebtOrder";

export class DebtOrderFixtures {
    constructor(private readonly web3: Web3, private readonly accounts: string[]) {

    }

    get unsignedOrder(): DebtOrder {
        const debtorSignature = {
            r: this.web3.utils.fromAscii(""),
            s: this.web3.utils.fromAscii(""),
            v: 0,
        };

        const underwriterSignature = {
            r: this.web3.utils.fromAscii(""),
            s: this.web3.utils.fromAscii(""),
            v: 0,
        };

        const creditorSignature = {
            r: this.web3.utils.fromAscii(""),
            s: this.web3.utils.fromAscii(""),
            v: 0,
        };

        return {
            kernelVersion: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
            issuanceVersion: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
            principalAmount: 0,
            principalToken: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
            collateralAmount: 0,
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
            termsContractParameters: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
            expirationTimestampInSec: 0,
            salt: 0,
            debtorSignature,
            creditorSignature,
            underwriterSignature,
        }
    }

    get signedOrder(): DebtOrder {
        return this.unsignedOrder;
    }
}
