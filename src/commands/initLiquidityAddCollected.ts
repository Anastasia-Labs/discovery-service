import { liquidityAddCollectedAction } from "../service/liquidity/liquidityAddCollectedAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
liquidityAddCollectedAction(lucid);