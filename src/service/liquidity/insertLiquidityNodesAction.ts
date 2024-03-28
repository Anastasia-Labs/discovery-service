import { Emulator, Lucid, insertLqNode } from "price-discovery-offchain";
import { setTimeout } from "timers/promises";
import "../../utils/env.js";

import {
  MAX_WALLET_GROUP_COUNT,
  WALLET_GROUP_START_INDEX,
} from "../../constants/utils.js";
import { getAppliedScripts, getDeployedScripts } from "../../utils/files.js";
import { isDryRun } from "../../utils/misc.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const insertLiquidityNodesAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  const applied = await getAppliedScripts();
  const deployed = await getDeployedScripts();

  const refNodePolicy = await lucid.provider.getUtxosByOutRef([
    deployed.scriptsRef.TasteTestPolicy,
  ]);
  const refNodeValidator = await lucid.provider.getUtxosByOutRef([
    deployed.scriptsRef.TasteTestValidator,
  ]);

  let loop = true;
  let walletIdx = WALLET_GROUP_START_INDEX;
  while (loop) {
    await selectLucidWallet(lucid, walletIdx);
    // Emulator needs this to refresh some random data.
    if (emulator) {
      await setTimeout(200);
      await lucid.wallet.getUtxos();
    }

    const tx = await insertLqNode(lucid, {
      currenTime: emulator?.now() ?? Date.now(),
      amountLovelace: 1_000_000n,
      scripts: {
        nodePolicy: applied.scripts.liquidityPolicy,
        nodeValidator: applied.scripts.liquidityValidator,
      },
      refScripts: {
        nodePolicy: refNodePolicy?.[0],
        nodeValidator: refNodeValidator?.[0],
      },
    });

    if (tx.type == "error") {
      throw tx.error;
    }

    if (isDryRun()) {
      console.log(tx.data.toString());
      loop = false;
    } else {
      console.log(`Depositing 1 ADA to TT with wallet: ${walletIdx}`);
      try {
        const txComplete = await tx.data.sign().complete();
        const txHash = await txComplete.submit();
        console.log(`Submitting: ${txHash}`);
        await lucid.awaitTx(txHash);

        if (walletIdx === MAX_WALLET_GROUP_COUNT - 1) {
          loop = false;
          console.log("Done!");
        } else {
          walletIdx++;
        }
      } catch (e) {
        console.log(
          "Failed to fund TT with wallet: " + walletIdx,
          (e as Error).message,
        );
        console.log("Waiting to try again...");
        await setTimeout(20_000);
      }
    }
  }
};
