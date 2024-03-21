import { foldLiquidityNodesAction } from "../service/liquidity/foldLiquidityNodesAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
foldLiquidityNodesAction(lucid);
