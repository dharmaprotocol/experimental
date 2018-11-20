import * as Web3 from "web3";
export interface ECDSASignature {
    r: string;
    s: string;
    v: number;
}
export declare function toECDSA(web3: Web3, signature: any): ECDSASignature;
export declare function ecSign(web3: Web3, message: string, address: string): Promise<ECDSASignature>;
