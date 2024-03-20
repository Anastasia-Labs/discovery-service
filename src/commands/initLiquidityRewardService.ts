import { initLiquidityRewardServiceAction } from "../service/liquidity/initLiquidityRewardServiceAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
initLiquidityRewardServiceAction(lucid);