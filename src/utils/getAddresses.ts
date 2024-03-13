import dotenv from "dotenv";
dotenv.config();
import {
  Blockfrost,
  Lucid,
  Network,
} from "price-discovery-offchain";
import { lovelaceAtAddress } from "./misc.js";
import { getLucidInstance, selectLucidWallet } from "./wallet.js";

const lucid = await getLucidInstance();

export const checkWalletFunds = async () => {
  await selectLucidWallet(0);
  console.log("WALLET_PROJECT_0");
  console.log({
    address: await lucid.wallet.address(),
    lovelace: await lovelaceAtAddress(lucid),
  });

  await selectLucidWallet(1);
  console.log("WALLET_PROJECT_1");
  console.log({
    address: await lucid.wallet.address(),
    lovelace: await lovelaceAtAddress(lucid),
  });

  console.log("WALLET_PROJECT_2");
  await selectLucidWallet(2);
  console.log({
    address: await lucid.wallet.address(),
    lovelace: await lovelaceAtAddress(lucid),
  });
};

await checkWalletFunds();
