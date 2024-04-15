import { registerStakeAction } from "../service/liquidity/registerStakeAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
registerStakeAction(lucid);
