import dotenv from "dotenv";
dotenv.config();
import { writeFile } from "node:fs";
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

const target = 100;
const wallets = [];
const path = "./test/wallets.json";

for (let i = 0; i < target; i++) {
  const seed = generateSeedPhrase();
  // console.log(await lucid.selectWalletFromSeed(seed).wallet.address());
  const wallet = {
    seed: seed,
    address: await lucid.selectWalletFromSeed(seed).wallet.address(),
  };
  wallets.push(wallet);
}

console.log(wallets);

writeFile(path, JSON.stringify(wallets, undefined, 2), (error) => {
  error ? console.log(error) : console.log(`Wallets saved at ${path} `);
});
