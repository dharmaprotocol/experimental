"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_1 = require("./bignumber");
exports.BigNumber = bignumber_1.BigNumber;
const constants_1 = require("./constants");
exports.NETWORK_ID_TO_NAME = constants_1.NETWORK_ID_TO_NAME;
exports.TOKEN_REGISTRY_TRACKED_TOKENS = constants_1.TOKEN_REGISTRY_TRACKED_TOKENS;
function getTokenRegistryIndex(tokenSymbol) {
    return new bignumber_1.BigNumber(constants_1.TOKEN_REGISTRY_TRACKED_TOKENS.findIndex(tokenData => tokenData.symbol === tokenSymbol));
}
exports.getTokenRegistryIndex = getTokenRegistryIndex;
//# sourceMappingURL=index.js.map