// External libraries
import * as chai from "chai";
import * as Web3 from "web3";
// Types
import * as addressBook from "dharma-address-book";

const addresses = addressBook.latest.development;

// Artifacts
const ContractRegistryInterface = artifacts.require("./ContractRegistryInterface.sol");

// Configuration
const expect = chai.expect;

const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

const debtKernelAddress = addresses.DebtKernel;
const debtTokenAddress = addresses.DebtToken;
const contractRegistryAddress = addresses.ContractRegistry;

const contractRegistry = new web3.eth.Contract(
    ContractRegistryInterface.abi,
    contractRegistryAddress,
);

contract("ContractRegistry", (accounts) => {
    describe("#debtKernel", () => {
       it("returns the address of the debt kernel", async () => {
           const receivedDebtKernelAddress = await contractRegistry.methods.debtKernel().call();
           expect(receivedDebtKernelAddress.toUpperCase()).to.eq(debtKernelAddress.toUpperCase());
       });
    });

    describe("#debtToken", () => {
        it("returns the address of the debt token", async () => {
            const receivedDebtTokenAddress = await contractRegistry.methods.debtToken().call();
            expect(receivedDebtTokenAddress.toUpperCase()).to.eq(debtTokenAddress.toUpperCase());
        });
    });
});
