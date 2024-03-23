export const EMULATOR_TT_END_DELAY = 1000 * 20 * 150; // 100 blocks.
export const MAX_WALLET_GROUP_COUNT =
  process.env.NODE_ENV === "emulator" ? 49 : 8;
export const WALLET_GROUP_START_INDEX = 3;
export const MIN_ADA_DEPLOY_WALLET =
  process.env.NODE_ENV === "emulator" ? 400_000_000_000n : 400_000_000n;
export const DEPLOY_WALLET_ADA =
  process.env.NODE_ENV === "emulator" ? 500_000_000_000n : 500_000_000n;
export const MIN_DEPLOY_UTXO_AMOUNT =
  process.env.NODE_ENV === "emulator" ? 49_000_000_000n : 49_000_000n;
