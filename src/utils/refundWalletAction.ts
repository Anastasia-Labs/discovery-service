import "./env.js";

import { Assets, Lucid, TxSigned } from "price-discovery-offchain";

import inquirer from "inquirer";
import { PUBLISH_SCRIPT_WALLET_INDEX } from "../constants/network.js";
import { MAX_WALLET_GROUP_COUNT } from "../constants/utils.js";
import { isDryRun } from "./args.js";
import { getTTConfig, getWallets } from "./files.js";
import { lovelaceAtAddress } from "./misc.js";
import { selectLucidWallet } from "./wallet.js";

export const refundWalletsAction = async (lucid: Lucid) => {
  const wallets = await getWallets();
  const { project } = await getTTConfig();
  const walletEntries = [...wallets.entries()].slice(0, MAX_WALLET_GROUP_COUNT);

  const signedTxs: { tx: TxSigned; index: number }[] = [];

  for (const [index, wallet] of walletEntries) {
    if (
      index === PUBLISH_SCRIPT_WALLET_INDEX &&
      project.addresses.publishScripts === wallet.address
    ) {
      const { cleanScripts } = await inquirer.prompt([
        {
          message:
            "You are trying to refund the wallet that also contains the published scripts. This will effectively DELETE the scripts! Continue?",
          type: "confirm",
          name: "cleanScripts",
          default: false,
        },
      ]);

      if (!cleanScripts) {
        continue;
      }
    }

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

    try {
      const tx = lucid
        .newTx()
        .collectFrom(utxos)
        .payToAddress(project.addresses.cleanupRefund, assets);

      const preSigned = await (await tx.complete()).sign().complete();
      const preSignedTxFee = preSigned.txSigned.body().fee();

      const newAssets = {
        ...assets,
        lovelace: totalLovelace - BigInt(preSignedTxFee.to_str()),
      };

      const realTx = await lucid
        .newTx()
        .collectFrom(utxos)
        .payToAddress(project.addresses.cleanupRefund, newAssets)
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
        const signedTx = await realTx.sign().complete();
        console.log(`Stored signed Tx for wallet: ${index}`);
        signedTxs.push({
          tx: signedTx,
          index,
        });
      }
    } catch (e) {
      console.log(
        `Could not build refund transaction for wallet ${index}. Got error: ${e}. Moving to next wallet...`,
      );
    }
  }

  if (isDryRun()) {
    return;
  }

  await Promise.all(
    signedTxs.map(async ({ tx, index }) => {
      const txHash = await tx.submit();
      console.log(`Refunding wallet #${index}:  ${txHash}`);
      await lucid.awaitTx(txHash);
    }),
  );

  console.log("Done!");
};
