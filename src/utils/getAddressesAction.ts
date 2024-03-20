import dotenv from "dotenv";
dotenv.config();
import { Lucid } from "price-discovery-offchain";

import { lovelaceAtAddress } from "./misc.js";
import { selectLucidWallet } from "./wallet.js";

export const getAddressesAction = async (lucid: Lucid) => {
  await selectLucidWallet(lucid, 0);
  console.log("WALLET_PROJECT_0");
  console.log({
    address: await lucid.wallet.address(),
    lovelace: await lovelaceAtAddress(lucid),
  });

  await selectLucidWallet(lucid, 1);
  console.log("WALLET_PROJECT_1");
  console.log({
    address: await lucid.wallet.address(),
    lovelace: await lovelaceAtAddress(lucid),
  });

  console.log("WALLET_PROJECT_2");
  await selectLucidWallet(lucid, 2);
  console.log({
    address: await lucid.wallet.address(),
    lovelace: await lovelaceAtAddress(lucid),
  });
};
