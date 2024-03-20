import { buildLiquidityScriptsAction } from "../service/liquidity/buildLiquidityScriptsAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
buildLiquidityScriptsAction(lucid);
  