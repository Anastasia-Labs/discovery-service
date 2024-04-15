import { initTokenHolderAction } from "../service/liquidity/initTokenHolderAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
initTokenHolderAction(lucid);
