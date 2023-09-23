import dotenv from "dotenv";
dotenv.config();
import {
  Blockfrost,
  generateSeedPhrase,
  Lucid,
  Network,
} from "price-discovery-offchain";
import { lovelaceAtAddress } from "./misc.js";

const lucid = await Lucid.new(
  new Blockfrost(process.env.API_URL!, process.env.API_KEY),
  process.env.NETWORK as Network
);

export const checkWalletFunds = async () => {
  lucid.selectWalletFromSeed(process.env.WALLET_PROJECT_0!);
  console.log("WALLET_PROJECT_0");
  console.log({
    address: await lucid.wallet.address(),
    lovelace: await lovelaceAtAddress(lucid),
  });

  lucid.selectWalletFromSeed(process.env.WALLET_PROJECT_1!);
  console.log("WALLET_PROJECT_1");
  console.log({
    address: await lucid.wallet.address(),
    lovelace: await lovelaceAtAddress(lucid),
  });

  console.log("WALLET_PROJECT_2");
  lucid.selectWalletFromSeed(process.env.WALLET_PROJECT_2!);
  console.log({
    address: await lucid.wallet.address(),
    lovelace: await lovelaceAtAddress(lucid),
  });
};

await checkWalletFunds();
