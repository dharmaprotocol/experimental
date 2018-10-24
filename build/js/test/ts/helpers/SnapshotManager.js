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
/**
 * Handles saving snapshots and reverting -- for use during tests.
 */
class SnapshotManager {
    constructor(web3) {
        this.web3 = web3;
        this.jsonRpcVersion = "2.0";
        this.evmCommands = {
            mine: "evm_mine",
            snapshot: "evm_snapshot",
            revert: "evm_revert",
        };
    }
    saveTestSnapshot() {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.sendJsonRpcRequestAsync(this.evmCommands.snapshot, []);
            yield this.mineBlock();
            return parseInt(response.result, 16);
        });
    }
    revertToSnapshot(snapshotId) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield this.sendJsonRpcRequestAsync(this.evmCommands.revert, [snapshotId]);
            yield this.mineBlock();
            return response.result;
        });
    }
    mineBlock() {
        const id = new Date().getTime() + 1;
        return this.sendJsonRpcRequestAsync(this.evmCommands.mine, [], id);
    }
    // A helper function for sending an RPC request to the chain.
    sendJsonRpcRequestAsync(method, params, id = new Date().getTime()) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                this.web3.currentProvider.send({
                    jsonrpc: this.jsonRpcVersion,
                    method,
                    params,
                    id,
                }, (error, response) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve(response);
                });
            });
        });
    }
    ;
}
exports.default = SnapshotManager;
//# sourceMappingURL=SnapshotManager.js.map