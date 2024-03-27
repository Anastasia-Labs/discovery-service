import "./env.js";

import { Assets, Lucid } from "price-discovery-offchain";

import wallets from "../../test/wallets.json" assert { type: "json" };
import { isDryRun } from "./misc.js";
import { selectLucidWallet } from "./wallet.js";

export const refundWalletsAction = async (lucid: Lucid) => {
  for (const [index, wallet] of wallets.entries()) {
    await selectLucidWallet(lucid, index);
    const utxos = await lucid.provider.getUtxos(wallet.address);
    const lovelaceOffset = -2_000_000n;
    const assets: Assets = {
      lovelace: lovelaceOffset,
    };

    for (const utxo of utxos) {
      for (const [id, amount] of Object.entries(utxo.assets)) {
        if (assets[id]) {
          assets[id] += amount;
        } else {
          assets[id] = amount;
        }
      }
    }

    const tx = await lucid
      .newTx()
      .collectFrom(utxos)
      .payToAddress(process.env.PROJECT_REFUND_ADDRESS!, assets)
      .complete();

    const preSigned = await tx.sign().complete();
    const preSignedTxFee = preSigned.txSigned.body().fee();

    const newAssets = {
      ...assets,
      lovelace:
        assets.lovelace + lovelaceOffset - BigInt(preSignedTxFee.to_str()),
    };
    const realTx = await lucid
      .newTx()
      .collectFrom(utxos)
      .payToAddress(process.env.PROJECT_REFUND_ADDRESS!, newAssets)
      .complete();

    if (isDryRun()) {
      console.log(realTx.toString());
      break;
    } else {
      const txHash = await (await realTx.sign().complete()).submit();
      console.log(`Refunding wallet #${index}:  ${txHash}`);
      await lucid.awaitTx(txHash);
      console.log("Done!");
    }
  }
};
