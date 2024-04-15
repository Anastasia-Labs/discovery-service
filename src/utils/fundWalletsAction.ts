import "./env.js";

import { Lucid } from "price-discovery-offchain";

import {
  MAX_WALLET_GROUP_COUNT,
  MIN_ADA_INSERT_WALLET,
  getPublishWalletAda,
} from "../constants/utils.js";
import { isDryRun } from "./args.js";
import {
  getFundWalletsTx,
  getTTConfig,
  getWallets,
  saveFundWalletsTx,
} from "./files.js";
import { selectLucidWallet } from "./wallet.js";

export async function fundWalletsAction(lucid: Lucid) {
  await selectLucidWallet(lucid, 0);

  if (!isDryRun()) {
    const completedTx = lucid.fromTx(await getFundWalletsTx());
    const signedTx = await completedTx.sign().complete();
    const txHash = await signedTx.submit();
    console.log(`Submitting: ${txHash}`);
    await lucid.awaitTx(txHash);
    console.log("Done!");
    return;
  }

  const wallets = await getWallets();
  const {
    project: { addresses },
  } = await getTTConfig();

  const tx = lucid.newTx();
  for (const [index, wallet] of wallets.entries()) {
    // Skip our seeded wallet.
    if (index === 0) {
      continue;
    }

    if (index === 1 && addresses.tokenHolder === wallet.address) {
      console.log("Sending 5 ADA to our token minting wallet.");
      tx.payToAddress(wallet.address, { lovelace: 5_000_000n });
      continue;
    }

    // We need at least 200 ada in the deploy wallet for reference scripts.
    if (index === 2) {
      const lovelace = await getPublishWalletAda();
      console.log(`Sending ${lovelace} lovelace to wallet: ${index}.`);
      tx.payToAddress(wallet.address, {
        lovelace,
      });
      continue;
    }

    tx.payToAddress(wallet.address, { lovelace: MIN_ADA_INSERT_WALLET });

    if (index === MAX_WALLET_GROUP_COUNT) {
      break;
    }
  }

  console.log(`Sending 10 ADA to ${MAX_WALLET_GROUP_COUNT - 2} other wallets.`);

  const txCbor = (await tx.complete()).toString();
  await saveFundWalletsTx(txCbor);
}
