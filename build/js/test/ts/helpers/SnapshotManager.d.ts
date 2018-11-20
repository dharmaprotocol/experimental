import * as Web3 from "web3";
/**
 * Handles saving snapshots and reverting -- for use during tests.
 */
export default class SnapshotManager {
    private readonly web3;
    readonly jsonRpcVersion = "2.0";
    readonly evmCommands: {
        mine: string;
        snapshot: string;
        revert: string;
    };
    constructor(web3: Web3);
    saveTestSnapshot(): Promise<number>;
    revertToSnapshot(snapshotId: number): Promise<boolean>;
    private mineBlock;
    private sendJsonRpcRequestAsync;
}
