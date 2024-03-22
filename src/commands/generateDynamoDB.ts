import { generateDBEntryAction } from "../service/liquidity/generateDBEntryAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
generateDBEntryAction(lucid);
