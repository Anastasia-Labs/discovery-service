import { fragmentPublishWalletAction } from "../service/liquidity/fragmentPublishWalletAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
fragmentPublishWalletAction(lucid);
