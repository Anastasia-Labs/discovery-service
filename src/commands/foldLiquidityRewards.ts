import { foldLiquidityRewardsAction } from "../service/liquidity/foldLiquidityRewardsAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
foldLiquidityRewardsAction(lucid);
