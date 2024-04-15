import { mintTokenAction } from "../utils/mintTokenAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
mintTokenAction(lucid);
