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
// External libraries
const chai = require("chai");
const Web3 = require("web3");
const addressBook = require("dharma-address-book");
const addresses = addressBook.latest.development;
// Artifacts
const ContractRegistryInterface = artifacts.require("./ContractRegistryInterface.sol");
// Configuration
const expect = chai.expect;
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
const debtKernelAddress = addresses.DebtKernel;
const debtTokenAddress = addresses.DebtToken;
const contractRegistryAddress = addresses.ContractRegistry;
const contractRegistry = new web3.eth.Contract(ContractRegistryInterface.abi, contractRegistryAddress);
contract("ContractRegistry", (accounts) => {
    describe("#debtKernel", () => {
        it("returns the address of the debt kernel", () => __awaiter(this, void 0, void 0, function* () {
            const receivedDebtKernelAddress = yield contractRegistry.methods.debtKernel().call();
            expect(receivedDebtKernelAddress.toUpperCase()).to.eq(debtKernelAddress.toUpperCase());
        }));
    });
    describe("#debtToken", () => {
        it("returns the address of the debt token", () => __awaiter(this, void 0, void 0, function* () {
            const receivedDebtTokenAddress = yield contractRegistry.methods.debtToken().call();
            expect(receivedDebtTokenAddress.toUpperCase()).to.eq(debtTokenAddress.toUpperCase());
        }));
    });
});
//# sourceMappingURL=ContractInteroperability.spec.js.map