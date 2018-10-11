import * as Web3 from "web3";
// Types
import { DebtOrder } from "../types/DebtOrder";
import { ECDSASignature } from "../types/ECDSASignature";

export class DebtOrderFixtures {
    readonly blankSignature: ECDSASignature = {
        r: this.web3.utils.fromAscii(""),
        s: this.web3.utils.fromAscii(""),
        v: 0,
    };

    constructor(private readonly web3: Web3, private readonly accounts: string[]) {

    }

    unsignedOrder(): DebtOrder {
        // The signatures will all be empty ECDSA signatures.
        const debtorSignature = this.blankSignature;
        const underwriterSignature = this.blankSignature;
        const creditorSignature = this.blankSignature;

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

    async signedOrder(): Promise<DebtOrder> {
        const unsignedOrder: DebtOrder = this.unsignedOrder();

        const commitmentHash = this.hashForOrder(unsignedOrder);

        const creditorSignature = await this.ecSign(
            commitmentHash,
            unsignedOrder.creditor
        );

        return {
            ...unsignedOrder,
            creditorSignature,
        };
    }

    private async ecSign(message: string, address: string): Promise<ECDSASignature> {
        // Sign the message from the address, which returns a string.
        const creditorSignature = await this.web3.eth.sign(
            message,
            address
        );

        // Convert that signature string to its ECDSA components.
        return this.toECDSA(creditorSignature);
    }

    private hashForOrder(order: DebtOrder): string {
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
            order.termsContractParameters,
        );
    }

    // Based on https://github.com/obscuren/ethmail/blob/master/client/ethmail.js#L7 by obscuren.
    private toECDSA(signature): ECDSASignature {
        const signatureText = signature.substr(2, signature.length);

        const r = '0x' + signatureText.substr(0, 64);
        const s = '0x' + signatureText.substr(64, 64);
        const v = this.web3.utils.hexToNumber(signatureText.substr(128, 2)) + 27;

        return {
            v,
            r,
            s
        };
    }
}
