import { setTimeout } from "timers/promises";
import dotenv from "dotenv";
dotenv.config();
import {
  Blockfrost,
  Lucid,
  Network,
} from "price-discovery-offchain";
import wallets from "../../test/wallets.json" assert { type: "json" };
import { safeAsync, signSubmitValidate } from "./misc.js";

async function fundWallets() {
  const lucid = await Lucid.new(
    new Blockfrost(process.env.API_URL!, process.env.API_KEY),
    process.env.NETWORK as Network
  );
  
  lucid.selectWalletFromSeed(process.env.WALLET_PROJECT_0!);
  
  const deployScriptsWallet = await Lucid.new(
    new Blockfrost(process.env.API_URL!, process.env.API_KEY),
    process.env.NETWORK as Network
  );
  
  deployScriptsWallet.selectWalletFromSeed(process.env.WALLET_PROJECT_2!);

  const tx = lucid.newTx();
  const seedWalletAddress = await lucid.wallet.address();
  const deployScriptAddress = await deployScriptsWallet.wallet.address();

  for (const [index, wallet] of wallets.entries()) {
    // Skip our seeded wallet.
    if (wallet.address === seedWalletAddress) {
      console.log("Found our seeded wallet!")
      continue;
    }

    // We need at least 500 ada in the deploy wallet for reference scripts.
    if (wallet.address === deployScriptAddress) {
      console.log("Sending 500 ADA to our deploy script wallet.")
      tx.payToAddress(wallet.address, { lovelace: 500_000_000n });
      continue;
    }

    // Limit 20 addresses.
    if (index === 20) {
      break;
    }

    console.log("Sending 5 ADA to " + wallet.address)
    tx.payToAddress(wallet.address, { lovelace: 5_000_000n });
  }

  const completedTx = await safeAsync(async () =>
    tx.complete()
  );

  return await signSubmitValidate(lucid, completedTx);
}

fundWallets();
