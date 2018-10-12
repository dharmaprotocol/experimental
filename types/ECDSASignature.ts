import * as Web3 from "web3";

export interface ECDSASignature {
    r: string;
    s: string;
    v: number;
}

// Based on https://github.com/obscuren/ethmail/blob/master/client/ethmail.js#L7 by obscuren.
export function toECDSA(web3: Web3, signature): ECDSASignature {
    const signatureText = signature.substr(2, signature.length);

    const r = '0x' + signatureText.substr(0, 64);
    const s = '0x' + signatureText.substr(64, 64);
    const v = web3.utils.hexToNumber(signatureText.substr(128, 2)) + 27;

    return {
        v,
        r,
        s
    };
}

export async function ecSign(web3: Web3, message: string, address: string): Promise<ECDSASignature> {
    // Sign the message from the address, which returns a string.
    const creditorSignature = await web3.eth.sign(
        message,
        address
    );

    // Convert that signature string to its ECDSA components.
    return toECDSA(web3, creditorSignature);
}
