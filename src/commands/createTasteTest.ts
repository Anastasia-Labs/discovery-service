import { createTasteTestAction } from "../service/liquidity/createTasteTestAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
createTasteTestAction(lucid);
