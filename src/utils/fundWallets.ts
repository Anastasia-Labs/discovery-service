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
import { getLucidInstance, selectLucidWallet } from "./wallet.js";

async function fundWallets() {
  const lucid = await getLucidInstance();
  await selectLucidWallet(0);

  const tx = lucid.newTx();

  for (const [index, wallet] of wallets.entries()) {
    // Skip our seeded wallet.
    if (index === 0) {
      console.log("Found our seeded wallet!")
      continue;
    }

    // We need at least 500 ada in the deploy wallet for reference scripts.
    if (index === 2) {
      console.log("Sending 500 ADA to our deploy script wallet.")
      tx.payToAddress(wallet.address, { lovelace: 500_000_000n });
      continue;
    }

    // Limit 10 addresses.
    if (index === 10) {
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
