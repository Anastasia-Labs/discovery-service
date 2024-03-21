import { initializeLiquidityAction } from "../service/liquidity/initializeLiquidityAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
initializeLiquidityAction(lucid);
