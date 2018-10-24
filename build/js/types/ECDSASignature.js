"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
// Based on https://github.com/obscuren/ethmail/blob/master/client/ethmail.js#L7 by obscuren.
function toECDSA(web3, signature) {
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
exports.toECDSA = toECDSA;
function ecSign(web3, message, address) {
    return __awaiter(this, void 0, void 0, function* () {
        // Sign the message from the address, which returns a string.
        const creditorSignature = yield web3.eth.sign(message, address);
        // Convert that signature string to its ECDSA components.
        return toECDSA(web3, creditorSignature);
    });
}
exports.ecSign = ecSign;
//# sourceMappingURL=ECDSASignature.js.map