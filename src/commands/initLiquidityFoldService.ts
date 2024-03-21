import { initLiquidityFoldServiceAction } from "../service/liquidity/initLiquidityFoldServiceAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
initLiquidityFoldServiceAction(lucid);