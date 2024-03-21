import { createWalletsAction } from "../utils/createWalletsAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
createWalletsAction(lucid);
