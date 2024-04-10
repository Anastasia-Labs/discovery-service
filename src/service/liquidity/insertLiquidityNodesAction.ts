import {
  Emulator,
  Lucid,
  TxSigned,
  insertLqNode,
} from "price-discovery-offchain";
import { setTimeout } from "timers/promises";
import "../../utils/env.js";

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

export const insertLiquidityNodesAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  const applied = await getAppliedScripts();
  const deployed = await getPublishedPolicyOutRefs();

  const [refNodePolicy] = await lucid.provider.getUtxosByOutRef([
    deployed.scriptsRef.TasteTestPolicy,
  ]);
  const [refNodeValidator] = await lucid.provider.getUtxosByOutRef([
    deployed.scriptsRef.TasteTestValidator,
  ]);

  const insertTxs: { tx: TxSigned; index: number }[] = [];

  for (let i = WALLET_GROUP_START_INDEX; i <= MAX_WALLET_GROUP_COUNT; i++) {
    await selectLucidWallet(lucid, i);

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
        console.log(`Submitting${i}: ${txHash}`);
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
