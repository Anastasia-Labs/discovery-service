import { deployLiquidityScriptsAction } from "../service/liquidity/deployLiquidityScriptsAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
deployLiquidityScriptsAction(lucid);