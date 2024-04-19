import inquirer from "inquirer";
import { generateSeedPhrase, Lucid } from "price-discovery-offchain";
import "./env.js";

import { IWallet } from "../@types/json.js";
import { getWallets, saveWallets } from "./files.js";
import { refundWalletsAction } from "./refundWalletAction.js";

export const createWalletsAction = async (lucid: Lucid) => {
  const target = 100;
  const wallets: IWallet[] = [];

  try {
    await getWallets(); // Check if wallets exist. Will throw if not.
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
  } catch (e) {}

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
