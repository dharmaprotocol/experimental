import * as Web3 from "web3";

declare type Address = string;
declare type ContractTest = (accounts: Address[]) => void;

interface Artifacts {
    require(name: string): Web3.ContractInstance;
}

declare global {
    function contract(name: string, test: ContractTest): void;

    var artifacts: Artifacts;
}
