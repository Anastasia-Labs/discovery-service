import "../../utils/env.js";

import { Emulator, Lucid, claimLiquidityNode } from "price-discovery-offchain";

import { setTimeout } from "timers/promises";
import {
  MAX_WALLET_GROUP_COUNT,
  WALLET_GROUP_START_INDEX,
} from "../../constants/utils.js";
import { isDryRun } from "../../utils/args.js";
import {
  getAppliedScripts,
  getPublishedPolicyOutRefs,
} from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const claimLiquidityNodeAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  const applied = await getAppliedScripts();
  const deployed = await getPublishedPolicyOutRefs();

  const [refNodePolicy, refNodeValidator] = await lucid.utxosByOutRef([
    deployed.scriptsRef.TasteTestPolicy,
    deployed.scriptsRef.TasteTestValidator,
  ]);

  let loop = true;
  let walletIdx = WALLET_GROUP_START_INDEX;
  while (loop) {
    console.log("Building claim with wallet: " + walletIdx);
    await selectLucidWallet(lucid, walletIdx);
    const tx = await claimLiquidityNode(lucid, {
      currenTime: emulator?.now() ?? Date.now(),
      burnToken: false,
      scripts: {
        liquidityPolicy: applied.scripts.liquidityPolicy,
        liquidityValidator: applied.scripts.liquidityValidator,
        rewardFoldPolicy: applied.scripts.rewardFoldPolicy,
      },
      refScripts: {
        liquidityPolicy: refNodePolicy,
        liquidityValidator: refNodeValidator,
      },
    });

    if (tx.type == "error") {
      if (tx.error.message.includes("missing node")) {
        if (walletIdx === MAX_WALLET_GROUP_COUNT) {
          loop = false;
          continue;
        }

        walletIdx++;
        console.log(
          `Could not find node for wallet ${walletIdx}. Moving on to next wallet...`,
        );
        continue;
      }

      throw tx.error;
    }

    if (isDryRun() && !emulator) {
      console.log(tx.data.toString());

      if (walletIdx === MAX_WALLET_GROUP_COUNT) {
        loop = false;
        console.log("Done!");
      } else {
        walletIdx++;
      }
    } else {
      try {
        const txComplete = await tx.data.sign().complete();
        const txHash = await txComplete.submit();
        console.log(`Submitting: ${txHash}`);

        if (walletIdx === MAX_WALLET_GROUP_COUNT - 1) {
          loop = false;
          console.log("Done!");
        } else {
          walletIdx++;
          await lucid.awaitTx(txHash);
        }
      } catch (e) {
        console.log(
          "Failed to claim with wallet: " + walletIdx,
          (e as Error).message,
        );
        console.log("Waiting to try again...");
        await setTimeout(20_000);
      }
    }
  }
};
