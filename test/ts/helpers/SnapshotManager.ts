import * as Web3 from "web3";

/**
 * Handles saving snapshots and reverting -- for use during tests.
 */
export default class SnapshotManager {
    constructor(private readonly web3: Web3) { }

    async saveTestSnapshot(): Promise<number> {
        const response = await this.sendJsonRpcRequestAsync("evm_snapshot", []);
        return parseInt(response.result, 16);
    }

    async revertToSnapshot(snapshotId: number): Promise<boolean> {
        const response = await this.sendJsonRpcRequestAsync("evm_revert", [snapshotId]);
        return response.result;
    }

    // A helper function for sending an RPC request to ganache-cli.
    private async sendJsonRpcRequestAsync (
        method: string,
        params: any[],
    ): Promise<Web3.JSONRPCResponsePayload> {
        const id = new Date().getTime();

        return new Promise((resolve, reject) => {
            this.web3.currentProvider.send({
                jsonrpc: '2.0',
                method,
                params,
                id,
            }, (err1) => {
                if (err1) {
                    return reject(err1);
                }

                // Mine a new block so that the update persists.
                this.web3.currentProvider.send({
                    jsonrpc: '2.0',
                    method: 'evm_mine',
                    id: id + 1,
                }, (err2, res) => (err2 ? reject(err2) : resolve(res)));
            });
        });
    };
}
