import { fundWalletsAction } from "../utils/fundWalletsAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
fundWalletsAction(lucid);
