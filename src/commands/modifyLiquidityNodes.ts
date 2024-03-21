import { modifyLiquidityNodesAction } from "../service/liquidity/modifyLiquidityNodesAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
modifyLiquidityNodesAction(lucid);
