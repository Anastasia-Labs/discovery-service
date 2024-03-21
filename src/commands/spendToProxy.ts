import { spendToProxyAction } from "../service/liquidity/spendToProxyAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
spendToProxyAction(lucid);
