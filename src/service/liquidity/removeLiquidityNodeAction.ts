import { Emulator, Lucid, removeLqNode } from "price-discovery-offchain";
import "../../utils/env.js";

import { isDryRun } from "../../utils/args.js";
import { getAppliedScripts } from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

import { setTimeout } from "timers/promises";
import "../../utils/env.js";

import { WALLET_GROUP_START_INDEX } from "../../constants/utils.js";
import { getPublishedPolicyOutRefs } from "../../utils/files.js";

export const removeLiquidityNodeAction = async (
  lucid: Lucid,
  emulator?: Emulator,
  emulatorDeadline?: number,
) => {
  const applied = await getAppliedScripts();
  const deployed = await getPublishedPolicyOutRefs();

  const refNodePolicy = await lucid.provider.getUtxosByOutRef([
    deployed.scriptsRef.TasteTestPolicy,
  ]);
  const refNodeValidator = await lucid.provider.getUtxosByOutRef([
    deployed.scriptsRef.TasteTestValidator,
  ]);

  let loop = true;
  let walletIdx = WALLET_GROUP_START_INDEX;
  while (loop) {
    console.log("Building withdraw with wallet: " + walletIdx);
    await selectLucidWallet(lucid, walletIdx);
    const tx = await removeLqNode(lucid, {
      currenTime: emulator?.now() ?? Date.now(),
      penaltyAddress: process.env.PENALTY_ADDRESS as string,
      deadline: emulatorDeadline ?? (Number(process.env.DEADLINE) as number),
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

      if (walletIdx === 3) {
        loop = false;
        console.log("Done!");
      } else {
        walletIdx++;
      }
    } else {
      try {
        console.log("Updating deposit with 1 ADA using wallet: " + walletIdx);
        const txComplete = await tx.data.sign().complete();
        const txHash = await txComplete.submit();
        console.log(`Submitting: ${txHash}`);

        if (walletIdx === 3) {
          loop = false;
          console.log("Done!");
        } else {
          walletIdx++;
          await lucid.awaitTx(txHash);
        }
      } catch (e) {
        console.log(
          "Failed to withdraw with wallet: " + walletIdx,
          (e as Error).message,
        );
        console.log("Waiting to try again...");
        await setTimeout(20_000);
      }
    }
  }
};
