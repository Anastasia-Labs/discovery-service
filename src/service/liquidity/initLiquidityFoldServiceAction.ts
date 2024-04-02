import {
  Emulator,
  InitFoldConfig,
  Lucid,
  initLqFold,
} from "price-discovery-offchain";
import "../../utils/env.js";

import { loggerDD } from "../../logs/datadog-service.js";
import { isDryRun } from "../../utils/args.js";
import { getAppliedScripts } from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const initLiquidityFoldServiceAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  const applied = await getAppliedScripts();

  const initFoldConfig: InitFoldConfig = {
    currenTime: emulator?.now() ?? Date.now(),
    scripts: {
      nodeValidator: applied.scripts.liquidityValidator,
      nodePolicy: applied.scripts.liquidityPolicy,
      foldPolicy: applied.scripts.collectFoldPolicy,
      foldValidator: applied.scripts.collectFoldValidator,
    },
  };

  await selectLucidWallet(lucid, 0);
  const initFoldUnsigned = await initLqFold(lucid, initFoldConfig);

  if (initFoldUnsigned.type == "error") {
    throw initFoldUnsigned.error;
  }

  if (isDryRun()) {
    console.log(initFoldUnsigned.data.toString());
  } else {
    const initFoldSigned = await initFoldUnsigned.data.sign().complete();
    const initFoldHash = await initFoldSigned.submit();
    console.log(`Submitting: ${initFoldHash}`);
    await lucid.awaitTx(initFoldHash);
    await loggerDD(`Done!`);
  }
};
