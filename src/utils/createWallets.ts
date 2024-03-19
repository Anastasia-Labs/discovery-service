import inquirer from "inquirer";
import dotenv from "dotenv";
dotenv.config();
import { writeFile } from "node:fs";
import { execSync } from "node:child_process";
import {
  generateSeedPhrase
} from "price-discovery-offchain";

import { getLucidInstance } from "./wallet.js";

const run = async () => {
  const lucid = await getLucidInstance();
  
  const target = 50;
  const wallets = [];
  const path = "./test/wallets.json";

  const { value } = await inquirer.prompt<{ value: string }>([
    {
      type: 'input',
      name: 'value',
      message: 'Do you want to apply refunds first? y/n (default: n)',
    }
  ]);

  if ("y" === value) {
    execSync(`yarn refund-wallets`);
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
}

run();
