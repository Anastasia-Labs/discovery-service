export const EMULATOR_TT_BLOCK_DURATION = 250;
export const EMULATOR_TT_END_DELAY = 1000 * 20 * EMULATOR_TT_BLOCK_DURATION;
export const MAX_WALLET_GROUP_COUNT = process.env.NODE_ENV?.includes("mainnet")
  ? 11
  : 49;
export const WALLET_GROUP_START_INDEX = 3;
export const MIN_ADA_DEPLOY_WALLET = 179_000_000n;
export const DEPLOY_WALLET_ADA = 180_000_000n;
export const MIN_ADA_INSERT_WALLET = 10_000_000n;
