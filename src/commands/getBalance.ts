import { getBalanceAction } from "../utils/getBalanceAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
getBalanceAction(lucid);
