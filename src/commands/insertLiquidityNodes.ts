import { insertLiquidityNodesAction } from "../service/liquidity/insertLiquidityNodesAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
insertLiquidityNodesAction(lucid);
