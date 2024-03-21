import { removeLiquidityNodeAction } from "../service/liquidity/removeLiquidityNodeAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
removeLiquidityNodeAction(lucid);
