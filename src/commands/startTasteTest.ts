import { startTasteTest } from "../service/startTasteTestAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
startTasteTest(lucid);
