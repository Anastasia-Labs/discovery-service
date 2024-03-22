import dotenv from "dotenv";
import inquirer from "inquirer";
import { writeFile } from "node:fs";
import { generateSeedPhrase, Lucid } from "price-discovery-offchain";
import { refundWalletsAction } from "./refundWalletAction.js";
dotenv.config();

export const createWalletsAction = async (lucid: Lucid) => {
  const target = 50;
  const wallets = [];
  const path = "./test/wallets.json";

  const { value } = await inquirer.prompt<{ value: string }>([
    {
      type: "input",
      name: "value",
      message: "Do you want to apply refunds first? y/n (default: n)",
    },
  ]);

  if ("y" === value) {
    await refundWalletsAction(lucid);
    console.log(`Done! Now creating new wallets...`);
  }

  for (let i = 0; i < target; i++) {
    const seed = generateSeedPhrase();
    const wallet = {
      seed: seed,
      address: await lucid.selectWalletFromSeed(seed).wallet.address(),
    };
    wallets.push(wallet);
  }

  writeFile(path, JSON.stringify(wallets, undefined, 2), (error) => {
    error ? console.log(error) : console.log(`Wallets saved at ${path} `);
  });

  console.log(`Fund this wallet address (seed wallet): ${wallets[0].address}`);
};
