import { refundWalletsAction } from "../utils/refundWalletAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
refundWalletsAction(lucid);