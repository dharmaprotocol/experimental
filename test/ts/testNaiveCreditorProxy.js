"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
// External libraries
var chai = require("chai");
var bignumber_js_1 = require("bignumber.js");
// Artifacts
var NaiveCreditorProxy = artifacts.require("./NaiveCreditorProxy.sol");
// Configuration
var expect = chai.expect;
;
contract("NaiveCreditorProxy", function (accounts) {
    describe("#cancelDebtOffer", function () {
        describe("when the order has not been filled", function () {
            it("returns false", function () { return __awaiter(_this, void 0, void 0, function () {
                var proxy, testOrder, _a, _b, _c, test, _d, _e;
                return __generator(this, function (_f) {
                    switch (_f.label) {
                        case 0: return [4 /*yield*/, NaiveCreditorProxy.deployed()];
                        case 1:
                            proxy = _f.sent();
                            testOrder = {
                                kernelVersion: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                                issuanceVersion: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                                principalAmount: new bignumber_js_1.BigNumber(0),
                                principalToken: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                                collateralAmount: new bignumber_js_1.BigNumber(0),
                                collateralToken: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                                debtor: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                                debtorFee: new bignumber_js_1.BigNumber(0),
                                creditor: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                                creditorFee: new bignumber_js_1.BigNumber(0),
                                relayer: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                                relayerFee: new bignumber_js_1.BigNumber(0),
                                underwriter: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                                underwriterFee: new bignumber_js_1.BigNumber(0),
                                underwriterRiskRating: new bignumber_js_1.BigNumber(0),
                                termsContract: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                                termsContractParameters: "0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd",
                                expirationTimestampInSec: new bignumber_js_1.BigNumber(0),
                                salt: new bignumber_js_1.BigNumber(0),
                                debtorSignature: { r: "", s: "", v: new bignumber_js_1.BigNumber(0) },
                                creditorSignature: { r: "", s: "", v: new bignumber_js_1.BigNumber(0) },
                                underwriterSignature: { r: "", s: "", v: new bignumber_js_1.BigNumber(0) },
                            };
                            // console.log(proxy.cancelDebtOffer.sendTransaction.getData());
                            console.log("mappings!", proxy.debtOfferCancelled);
                            _b = (_a = console).log;
                            _c = ["returns"];
                            return [4 /*yield*/, proxy.debtOfferCancelled.call("0x601e6e7711b9e3b1b20e1e8016038a32dfc86ddd")];
                        case 2:
                            _b.apply(_a, _c.concat([_f.sent()]));
                            test = {
                                test: true,
                            };
                            _e = (_d = console).log;
                            return [4 /*yield*/, proxy.testFunction.call(test)];
                        case 3:
                            _e.apply(_d, [_f.sent()]);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
});
