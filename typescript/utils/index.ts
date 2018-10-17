import { BigNumber } from "./bignumber";
import { NETWORK_ID_TO_NAME, TOKEN_REGISTRY_TRACKED_TOKENS } from "./constants";

export { BigNumber, NETWORK_ID_TO_NAME, TOKEN_REGISTRY_TRACKED_TOKENS };

export function getTokenRegistryIndex(tokenSymbol) {
    return new BigNumber(TOKEN_REGISTRY_TRACKED_TOKENS.findIndex(tokenData => tokenData.symbol === tokenSymbol));
}
