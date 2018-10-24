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
const Web3 = require("web3");
const valid_max_ltv_loan_order_params_1 = require("./scenarios/valid_max_ltv_loan_order_params");
const constructor_1 = require("./runners/constructor");
const create_and_sign_as_creditor_1 = require("./runners/create_and_sign_as_creditor");
const sign_as_creditor_1 = require("./runners/sign_as_creditor");
const sign_as_debtor_1 = require("./runners/sign_as_debtor");
const accept_as_debtor_1 = require("./runners/accept_as_debtor");
const web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
describe("Max LTV Loan Offer (Integration)", () => {
    describe("constructor", () => {
        constructor_1.testConstructor(web3, valid_max_ltv_loan_order_params_1.VALID_MAX_LTV_LOAN_ORDER_PARAMS);
    });
    describe("createAndSignAsCreditor", () => __awaiter(this, void 0, void 0, function* () {
        yield create_and_sign_as_creditor_1.testCreateAndSignAsCreditor(web3, valid_max_ltv_loan_order_params_1.VALID_MAX_LTV_LOAN_ORDER_PARAMS);
    }));
    describe("signAsCreditor", () => __awaiter(this, void 0, void 0, function* () {
        yield sign_as_creditor_1.testSignAsCreditor(web3, valid_max_ltv_loan_order_params_1.VALID_MAX_LTV_LOAN_ORDER_PARAMS);
    }));
    describe("signAsDebtor", () => __awaiter(this, void 0, void 0, function* () {
        yield sign_as_debtor_1.testSignAsDebtor(web3, valid_max_ltv_loan_order_params_1.VALID_MAX_LTV_LOAN_ORDER_PARAMS);
    }));
    describe("acceptAsDebtor", () => __awaiter(this, void 0, void 0, function* () {
        yield accept_as_debtor_1.testAcceptAsDebtor(web3, valid_max_ltv_loan_order_params_1.VALID_MAX_LTV_LOAN_ORDER_PARAMS);
    }));
});
//# sourceMappingURL=max_ltv_loan_offer.spec.js.map