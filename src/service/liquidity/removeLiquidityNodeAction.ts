import { Emulator, Lucid, removeLqNode } from "price-discovery-offchain";
import "../../utils/env.js";

import { MAX_WALLET_GROUP_COUNT } from "../../constants/utils.js";
import { getAppliedScripts } from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const removeLiquidityNodeAction = async (
  lucid: Lucid,
  emulator?: Emulator,
  emulatorDeadline?: number,
) => {
  const applied = await getAppliedScripts();
  await selectLucidWallet(lucid, MAX_WALLET_GROUP_COUNT - 1);

  const tx = await removeLqNode(lucid, {
    currenTime: emulator?.now() ?? Date.now(),
    penaltyAddress: process.env.PENALTY_ADDRESS as string,
    scripts: {
      nodePolicy: applied.scripts.liquidityPolicy,
      nodeValidator: applied.scripts.liquidityValidator,
    },
    deadline: emulatorDeadline ?? (Number(process.env.DEADLINE) as number),
  });

  if (tx.type == "error") {
    throw tx.error;
  }

  if (process.env.DRY_RUN!) {
    console.log(tx.data.toString());
  } else {
    const txComplete = await tx.data.sign().complete();
    const txHash = await txComplete.submit();
    console.log(`Submitting: ${txHash}`);
    await lucid.awaitTx(txHash);
    console.log("Done!");
  }
};
