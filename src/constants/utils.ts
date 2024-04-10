import { getRefScriptAmountsByIndex } from "../service/liquidity/fragmentPublishWalletAction.js";
import { getNetwork } from "../utils/args.js";

export const EMULATOR_TT_BLOCK_DURATION = 250;
export const EMULATOR_TT_END_DELAY = 1000 * 20 * EMULATOR_TT_BLOCK_DURATION;
export const MAX_WALLET_GROUP_COUNT = getNetwork() === "mainnet" ? 11 : 49;
export const WALLET_GROUP_START_INDEX = 3;
// Takes the accumulated amount in fundWalletsActions.ts, and pads with 10 ADA for fees, etc.
export const PUBLISH_WALLET_ADA =
  (await getRefScriptAmountsByIndex()).reduce((total, n) => total + n, 0n) +
  10_000_000n;
export const MIN_ADA_INSERT_WALLET = 10_000_000n;
