import { createV1PoolAction } from "../service/liquidity/createV1PoolAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
createV1PoolAction(lucid);
