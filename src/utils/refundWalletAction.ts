import "./env.js";

import { Assets, Lucid } from "price-discovery-offchain";

import wallets from "../../test/wallets.json" assert { type: "json" };
import { MAX_WALLET_GROUP_COUNT } from "../constants/utils.js";
import { isDryRun, lovelaceAtAddress } from "./misc.js";
import { selectLucidWallet } from "./wallet.js";

export const refundWalletsAction = async (lucid: Lucid) => {
  const walletEntries = [...wallets.entries()].slice(0, MAX_WALLET_GROUP_COUNT);

  for (const [index, wallet] of walletEntries) {
    await selectLucidWallet(lucid, index);
    const utxos = await lucid.provider.getUtxos(wallet.address);
    const totalLovelace = await lovelaceAtAddress(lucid);
    const assets: Assets = {
      lovelace: totalLovelace - 650_000n,
    };

    for (const utxo of utxos) {
      for (const [id, amount] of Object.entries(utxo.assets)) {
        if (id === "lovelace") {
          continue;
        }

        if (assets[id]) {
          assets[id] += amount;
        } else {
          assets[id] = amount;
        }
      }
    }

    if (totalLovelace === 0n && Object.keys(assets).length > 1) {
      console.log(
        `Wallet has no ADA, but other assets. Consider funding to withdraw them.`,
      );
      continue;
    } else if (totalLovelace === 0n) {
      continue;
    }

    console.log({
      totalLovelace,
      assets,
    });

    try {
      const tx = lucid
        .newTx()
        .collectFrom(utxos)
        .payToAddress(process.env.PROJECT_REFUND_ADDRESS!, assets);

      const preSigned = await (await tx.complete()).sign().complete();
      const preSignedTxFee = preSigned.txSigned.body().fee();

      const newAssets = {
        ...assets,
        lovelace: totalLovelace - BigInt(preSignedTxFee.to_str()),
      };

      const realTx = await lucid
        .newTx()
        .collectFrom(utxos)
        .payToAddress(process.env.PROJECT_REFUND_ADDRESS!, newAssets)
        .complete();

      if (isDryRun()) {
        console.log(realTx.toString());

        if (index === MAX_WALLET_GROUP_COUNT) {
          console.log("Done!");
          break;
        } else {
          continue;
        }
      } else {
        const txHash = await (await realTx.sign().complete()).submit();
        console.log(`Refunding wallet #${index}:  ${txHash}`);
        await lucid.awaitTx(txHash);
        console.log("Done!");
      }
    } catch (e) {
      console.log(
        `Could not build refund transaction for wallet ${index}. Got error: ${e}. Moving to next wallet...`,
      );
    }
  }
};
