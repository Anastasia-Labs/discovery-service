import { getRefScriptAmountsByIndex } from "../service/liquidity/fragmentPublishWalletAction.js";
import { getNetwork } from "../utils/args.js";

export const EMULATOR_TT_BLOCK_DURATION = 250;
export const EMULATOR_TT_END_DELAY = 1000 * 20 * EMULATOR_TT_BLOCK_DURATION;
export const MAX_WALLET_GROUP_COUNT = getNetwork() === "mainnet" ? 11 : 49;
export const WALLET_GROUP_START_INDEX = 3;
export const BASE_PUBLISH_WALLET_ADA = 200_000_000n;
export const MIN_ADA_INSERT_WALLET = 10_000_000n;

export const getPublishWalletAda = async () => {
  try {
    const val =
      (await getRefScriptAmountsByIndex()).reduce((total, n) => total + n, 0n) +
      BASE_PUBLISH_WALLET_ADA;
    return val;
  } catch (e) {
    return BASE_PUBLISH_WALLET_ADA;
  }
};
