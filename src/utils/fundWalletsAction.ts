import dotenv from "dotenv";
dotenv.config();
import { Lucid } from "price-discovery-offchain";

import wallets from "../../test/wallets.json" assert { type: "json" };
import { safeAsync, signSubmitValidate } from "./misc.js";
import { selectLucidWallet } from "./wallet.js";
import { MAX_WALLET_GROUP_COUNT } from "../constants/utils.js";

export async function fundWalletsAction(lucid: Lucid) {
  await selectLucidWallet(lucid, 0);

  const tx = lucid.newTx();

  for (const [index, wallet] of wallets.entries()) {
    // Skip our seeded wallet.
    if (index === 0) {
      console.log("Found our seeded wallet!")
      continue;
    }

    if (index === 1) {
      console.log("Sending 5 ADA to our token minting wallet.");
      tx.payToAddress(wallet.address, { lovelace: 5_000_000n });
      continue;
    }

    // We need at least 500 ada in the deploy wallet for reference scripts.
    if (index === 2) {
      console.log("Sending 500 ADA to our deploy script wallet.")
      tx.payToAddress(wallet.address, { lovelace: 500_000_000n });
      continue;
    }

    if (index > MAX_WALLET_GROUP_COUNT) {
      break;
    }

    console.log("Sending 15 ADA to wallet: " + index)
    tx.payToAddress(wallet.address, { lovelace: 15_000_000n });
  }

  const completedTx = await safeAsync(async () =>
    tx.complete()
  );

  return await signSubmitValidate(lucid, completedTx);
}
