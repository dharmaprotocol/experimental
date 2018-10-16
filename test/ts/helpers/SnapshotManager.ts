import * as Web3 from "web3";

/**
 * Handles saving snapshots and reverting -- for use during tests.
 */
export default class SnapshotManager {
    readonly jsonRpcVersion = "2.0";

    readonly evmCommands = {
        mine: "evm_mine",
        snapshot: "evm_snapshot",
        revert: "evm_revert",
    };

    constructor(private readonly web3: Web3) {}

    async saveTestSnapshot(): Promise<number> {
        const response = await this.sendJsonRpcRequestAsync(this.evmCommands.snapshot, []);

        await this.mineBlock();

        return parseInt(response.result, 16);
    }

    async revertToSnapshot(snapshotId: number): Promise<boolean> {
        const response = await this.sendJsonRpcRequestAsync(
            this.evmCommands.revert,
            [snapshotId],
        );

        await this.mineBlock();

        return response.result;
    }

    private mineBlock() {
        const id = new Date().getTime() + 1;
        return this.sendJsonRpcRequestAsync(this.evmCommands.mine, [], id);
    }

    // A helper function for sending an RPC request to the chain.
    private async sendJsonRpcRequestAsync(
        method: string,
        params: any[],
        id = new Date().getTime(),
    ): Promise<Web3.JSONRPCResponsePayload> {
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
    };
}
