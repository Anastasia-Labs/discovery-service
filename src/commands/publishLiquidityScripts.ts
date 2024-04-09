import { publishLiquidityScriptsAction } from "../service/liquidity/publishLiquidityScriptsAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
publishLiquidityScriptsAction(lucid);
