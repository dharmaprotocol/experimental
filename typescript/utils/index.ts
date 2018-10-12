import { BigNumber } from "./bignumber";
import { TOKEN_REGISTRY_TRACKED_TOKENS } from "./constants";

export { BigNumber };
export { TOKEN_REGISTRY_TRACKED_TOKENS };

export function getTokenRegistryIndex(tokenSymbol) {
    return new BigNumber(TOKEN_REGISTRY_TRACKED_TOKENS.findIndex(tokenData => tokenData.symbol === tokenSymbol));
}
