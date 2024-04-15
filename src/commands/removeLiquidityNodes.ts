import { removeLiquidityNodesAction } from "../service/liquidity/removeLiquidityNodesAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
removeLiquidityNodesAction(lucid);
