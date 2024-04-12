import {
  Emulator,
  InitFoldConfig,
  Lucid,
  initLqFold,
} from "price-discovery-offchain";
import "../../utils/env.js";

import { SEED_WALLET_INDEX } from "../../constants/network.js";
import { loggerDD } from "../../logs/datadog-service.js";
import { isDryRun } from "../../utils/args.js";
import {
  getAppliedScripts,
  getInitLiquidityFoldTx,
  saveInitLiquidityFoldTx,
} from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

const submitInitLiquidityFoldServiceAction = async (lucid: Lucid) => {
  const initFoldTx = await getInitLiquidityFoldTx();
  if (!initFoldTx) {
    throw new Error(`Could not find an initFoldTx transaction to submit.`);
  }

  const initFoldSigned = await lucid.fromTx(initFoldTx).sign().complete();
  const initFoldHash = await initFoldSigned.submit();
  console.log(`Submitting: ${initFoldHash}`);
  await lucid.awaitTx(initFoldHash);
  await loggerDD(`Done!`);
};

export const initLiquidityFoldServiceAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  const applied = await getAppliedScripts();
  await selectLucidWallet(lucid, SEED_WALLET_INDEX);

  if (!isDryRun() && !emulator) {
    await submitInitLiquidityFoldServiceAction(lucid);
    return;
  }

  const initFoldConfig: InitFoldConfig = {
    currenTime: emulator?.now() ?? Date.now(),
    scripts: {
      nodeValidator: applied.scripts.liquidityValidator,
      nodePolicy: applied.scripts.liquidityPolicy,
      foldPolicy: applied.scripts.collectFoldPolicy,
      foldValidator: applied.scripts.collectFoldValidator,
    },
  };

  const initFoldUnsigned = await initLqFold(lucid, initFoldConfig);

  if (initFoldUnsigned.type == "error") {
    throw initFoldUnsigned.error;
  }

  await saveInitLiquidityFoldTx(
    initFoldUnsigned.data.toString(),
    Boolean(emulator),
  );
  if (emulator) {
    await submitInitLiquidityFoldServiceAction(lucid);
  }
};
