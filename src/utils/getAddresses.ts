import dotenv from "dotenv";
dotenv.config();
import {
  Blockfrost,
  generateSeedPhrase,
  Lucid,
  Network,
} from "price-discovery-offchain";

const lucid = await Lucid.new(
  new Blockfrost(process.env.API_URL!, process.env.API_KEY),
  process.env.NETWORK as Network
);

export const checkWalletFunds = async () => {
  lucid.selectWalletFromSeed(process.env.WALLET_PROJECT_0!);
  console.log("WALLET_PROJECT_0")
  console.log({
    address: await lucid.wallet.address(),
    lovelace: (await lucid.wallet.getUtxos()).reduce((result, current) => {
      return (result = result + current.assets["lovelace"]);
    }, 0n),
  });

  lucid.selectWalletFromSeed(process.env.WALLET_PROJECT_1!);
  console.log("WALLET_PROJECT_1")
  console.log({
    address: await lucid.wallet.address(),
    lovelace: (await lucid.wallet.getUtxos()).reduce((result, current) => {
      return (result = result + current.assets["lovelace"]);
    }, 0n),
  });

  console.log("WALLET_PROJECT_2")
  lucid.selectWalletFromSeed(process.env.WALLET_PROJECT_2!);
  console.log({
    address: await lucid.wallet.address(),
    lovelace: (await lucid.wallet.getUtxos()).reduce((result, current) => {
      return (result = result + current.assets["lovelace"]);
    }, 0n),
  });
};

await checkWalletFunds();
