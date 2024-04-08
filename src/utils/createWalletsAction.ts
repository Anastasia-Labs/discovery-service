import inquirer from "inquirer";
import { generateSeedPhrase, Lucid } from "price-discovery-offchain";
import "./env.js";

import { IWallet } from "../@types/json.js";
import { saveWallets } from "./files.js";
import { refundWalletsAction } from "./refundWalletAction.js";

export const createWalletsAction = async (lucid: Lucid) => {
  const target = 100;
  const wallets: IWallet[] = [];

  const { applyRefunds } = await inquirer.prompt<{ applyRefunds: boolean }>([
    {
      type: "confirm",
      name: "applyRefunds",
      message: "Do you want to apply refunds first?",
      default: false,
    },
  ]);

  if (applyRefunds) {
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

  await saveWallets(wallets);
};
