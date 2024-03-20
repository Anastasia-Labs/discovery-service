import { mintNFTAction } from "../utils/mintTokenAction.js";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
mintNFTAction(lucid);