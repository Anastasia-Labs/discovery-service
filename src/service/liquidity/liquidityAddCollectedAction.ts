import {
  AddCollectedConfig,
  Emulator,
  Lucid,
  addCollected,
} from "price-discovery-offchain";
import "../../utils/env.js";

import { loggerDD } from "../../logs/datadog-service.js";
import { isDryRun } from "../../utils/args.js";
import {
  getAddCollectedTx,
  getAppliedScripts,
  getPublishedPolicyOutRefs,
  saveAddCollectedTx,
} from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

const submitLiquidityAddCollectedAction = async (lucid: Lucid) => {
  const addCollectedTx = await getAddCollectedTx();
  if (!addCollectedTx) {
    throw new Error("Could not find an addCollected transaction to submit.");
  }

  const addCollectedSigned = await lucid
    .fromTx(addCollectedTx)
    .sign()
    .complete();
  const addCollectedHash = await addCollectedSigned.submit();
  console.log(`Submitted: ${addCollectedHash}`);
  await lucid.awaitTx(addCollectedHash);
  await loggerDD(`Done!`);
};

export const liquidityAddCollectedAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  await selectLucidWallet(lucid, 0);
  const applied = await getAppliedScripts();
  const deployed = await getPublishedPolicyOutRefs();

  if (!isDryRun() && !emulator) {
    await submitLiquidityAddCollectedAction(lucid);
    return;
  }

  const addCollectedConfig: AddCollectedConfig = {
    currenTime: emulator?.now() ?? Date.now(),
    scripts: {
      collectFoldPolicy: applied.scripts.collectFoldPolicy,
      collectFoldValidator: applied.scripts.collectFoldValidator,
    },
    refScripts: {
      tokenHolderPolicy: deployed.scriptsRef.TokenHolderPolicy,
      tokenHolderValidator: deployed.scriptsRef.TokenHolderValidator,
    },
  };

  const addCollectedUnsigned = await addCollected(lucid, addCollectedConfig);

  if (addCollectedUnsigned.type == "error") {
    throw addCollectedUnsigned.error;
  }

  await saveAddCollectedTx(
    addCollectedUnsigned.data.toString(),
    Boolean(emulator),
  );

  if (emulator) {
    await submitLiquidityAddCollectedAction(lucid);
  }
};
