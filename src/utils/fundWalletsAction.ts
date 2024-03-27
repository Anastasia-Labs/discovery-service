import "./env.js";

import { Lucid } from "price-discovery-offchain";

import wallets from "../../test/wallets.json" assert { type: "json" };
import { MAX_WALLET_GROUP_COUNT } from "../constants/utils.js";
import { isDryRun } from "./misc.js";
import { selectLucidWallet } from "./wallet.js";

export async function fundWalletsAction(lucid: Lucid) {
  await selectLucidWallet(lucid, 0);

  const tx = lucid.newTx();

  for (const [index, wallet] of wallets.entries()) {
    // Skip our seeded wallet.
    if (index === 0) {
      console.log("Found our seeded wallet!");
      continue;
    }

    if (index === 1) {
      console.log("Sending 5 ADA to our token minting wallet.");
      tx.payToAddress(wallet.address, { lovelace: 5_000_000n });
      continue;
    }

    // We need at least 200 ada in the deploy wallet for reference scripts.
    if (index === 2) {
      console.log("Sending 180 ADA to our deploy script wallet.");
      tx.payToAddress(wallet.address, { lovelace: 180_000_000n });
      continue;
    }

    if (index > MAX_WALLET_GROUP_COUNT) {
      break;
    }

    console.log("Sending 6 ADA to wallet: " + index);
    tx.payToAddress(wallet.address, { lovelace: 6_000_000n });
  }

  const completedTx = await tx.complete();
  if (isDryRun()) {
    console.log(completedTx.toString());
  } else {
    const signedTx = await completedTx.sign().complete();
    const txHash = await signedTx.submit();
    console.log(`Submitting: ${txHash}`);
    await lucid.awaitTx(txHash);
    console.log("Done!");
  }
}
