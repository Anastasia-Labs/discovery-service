import { getAddressesAction } from "../utils/getAddressesAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
getAddressesAction(lucid);