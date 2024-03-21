import dotenv from "dotenv";
dotenv.config();
import {
  addCollected,
  AddCollectedConfig,
  Lucid,
  Emulator,
} from "price-discovery-offchain";

import { loggerDD } from "../../logs/datadog-service.js";
import { selectLucidWallet } from "../../utils/wallet.js";
import { getAppliedScripts, getDeployedScripts } from "../../utils/files.js";

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
    console.log(addCollectedUnsigned.error);
    return;
  }

  const addCollectedSigned = await addCollectedUnsigned.data.sign().complete();
  const addCollectedHash = await addCollectedSigned.submit();
  console.log(`Submitted: ${addCollectedHash}`);
  await lucid.awaitTx(addCollectedHash);
  await loggerDD(`Done!`);
};
