import { claimLiquidityNodeAction } from "../service/liquidity/claimLiquidityNodeAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
claimLiquidityNodeAction(lucid);
