import { Emulator, Lucid, insertLqNode } from "price-discovery-offchain";
import { setTimeout } from "timers/promises";
import "../../utils/env.js";

import {
  MAX_WALLET_GROUP_COUNT,
  MIN_ADA_INSERT_WALLET,
  WALLET_GROUP_START_INDEX,
} from "../../constants/utils.js";
import { isDryRun } from "../../utils/args.js";
import {
  getAppliedScripts,
  getPublishedPolicyOutRefs,
} from "../../utils/files.js";
import { lovelaceAtAddress } from "../../utils/misc.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const insertLiquidityNodesAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  const applied = await getAppliedScripts();
  const deployed = await getPublishedPolicyOutRefs();

  const [refNodePolicy, refNodeValidator] =
    await lucid.provider.getUtxosByOutRef([
      deployed.scriptsRef.TasteTestPolicy,
      deployed.scriptsRef.TasteTestValidator,
    ]);

  for (let i = WALLET_GROUP_START_INDEX; i <= MAX_WALLET_GROUP_COUNT; i++) {
    await selectLucidWallet(lucid, i);

    // Check if wallet does not have the min amount.
    const lovelace = await lovelaceAtAddress(lucid);
    if (lovelace !== MIN_ADA_INSERT_WALLET) {
      continue;
    }

    const tx = await insertLqNode(lucid, {
      currenTime: emulator?.now() ?? Date.now(),
      amountLovelace: 1_000_000n,
      scripts: {
        nodePolicy: applied.scripts.liquidityPolicy,
        nodeValidator: applied.scripts.liquidityValidator,
      },
      refScripts: {
        nodePolicy: refNodePolicy,
        nodeValidator: refNodeValidator,
      },
    });

    if (tx.type == "error") {
      throw tx.error;
    }

    if (isDryRun() && !emulator) {
      console.log(tx.data.toString());
      continue;
    } else {
      try {
        const signedTx = await tx.data.sign().complete();
        console.log(`Depositing 1 ADA to TT with wallet ${i}...`);
        const txHash = await signedTx.submit();
        console.log(`Submitting: ${txHash}`);
        await lucid.awaitTx(txHash);
        console.log(`Done, moving to next wallet...`);
      } catch (e) {
        console.log(
          "Failed to fund TT with wallet: " + i,
          (e as Error).message,
        );
        console.log("Waiting to try again...");
        await setTimeout(20_000);
      }
    }
  }

  console.log(`Done!`);
};
