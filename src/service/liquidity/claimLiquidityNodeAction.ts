import dotenv from "dotenv";
import { Emulator, Lucid, claimLiquidityNode } from "price-discovery-offchain";
dotenv.config();

import { getAppliedScripts, getDeployedScripts } from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const claimLiquidityNodeAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  const applied = await getAppliedScripts();
  const deployed = await getDeployedScripts();
  await selectLucidWallet(lucid, 4);

  const tx = await claimLiquidityNode(lucid, {
    currenTime: emulator?.now() ?? Date.now(),
    burnToken: false,
    scripts: {
      liquidityPolicy: applied.scripts.liquidityPolicy,
      liquidityValidator: applied.scripts.liquidityValidator,
      rewardFoldPolicy: applied.scripts.rewardFoldPolicy,
    },
    refScripts: {
      liquidityPolicy: (
        await lucid.utxosByOutRef([deployed.scriptsRef.TasteTestPolicy])
      )?.[0],
      liquidityValidator: (
        await lucid.utxosByOutRef([deployed.scriptsRef.TasteTestValidator])
      )?.[0],
    },
  });

  if (tx.type == "error") {
    console.log(tx.error);
    return;
  }

  const txComplete = await tx.data.sign().complete();
  const txHash = await txComplete.submit();
  console.log(`Submitting: ${txHash}`);
  await lucid.awaitTx(txHash);
  console.log("Done!");
};
