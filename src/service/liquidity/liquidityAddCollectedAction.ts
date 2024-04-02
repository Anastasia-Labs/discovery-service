import {
  AddCollectedConfig,
  Emulator,
  Lucid,
  addCollected,
} from "price-discovery-offchain";
import "../../utils/env.js";

import { loggerDD } from "../../logs/datadog-service.js";
import { isDryRun } from "../../utils/args.js";
import { getAppliedScripts, getDeployedScripts } from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const liquidityAddCollectedAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  const applied = await getAppliedScripts();
  const deployed = await getDeployedScripts();

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

  await selectLucidWallet(lucid, 0);
  const addCollectedUnsigned = await addCollected(lucid, addCollectedConfig);

  if (addCollectedUnsigned.type == "error") {
    throw addCollectedUnsigned.error;
  }

  if (isDryRun()) {
    console.log(addCollectedUnsigned.data.toString());
  } else {
    const addCollectedSigned = await addCollectedUnsigned.data
      .sign()
      .complete();
    const addCollectedHash = await addCollectedSigned.submit();
    console.log(`Submitted: ${addCollectedHash}`);
    await lucid.awaitTx(addCollectedHash);
    await loggerDD(`Done!`);
  }
};
