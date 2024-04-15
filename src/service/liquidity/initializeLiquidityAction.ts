import "../../utils/env.js";

import {
  Emulator,
  InitNodeConfig,
  Lucid,
  initLqNode,
} from "price-discovery-offchain";

import { SEED_WALLET_INDEX } from "../../constants/network.js";
import { loggerDD } from "../../logs/datadog-service.js";
import { isDryRun } from "../../utils/args.js";
import {
  getAppliedScripts,
  getInitTTTx,
  getPublishedPolicyOutRefs,
  saveInitTTTx,
} from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

const submitInitLiquidityAction = async (lucid: Lucid) => {
  const tx = await getInitTTTx();
  if (!tx) {
    throw new Error(
      `An initTT transaction was not found. Run "yarn start-tt --dry" to generate one, and try again.`,
    );
  }

  const signed = await lucid.fromTx(tx).sign().complete();
  const initNodeHash = await signed.submit();
  await loggerDD(`Submitting: ${initNodeHash}`);
  await lucid.awaitTx(initNodeHash);
  await loggerDD(`Done!`);
};

export const initializeLiquidityAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  await selectLucidWallet(lucid, SEED_WALLET_INDEX);
  const applied = await getAppliedScripts();
  const deployed = await getPublishedPolicyOutRefs();

  if (!isDryRun() && !emulator) {
    await submitInitLiquidityAction(lucid);
    return;
  }

  const [initUTXO, nodePolicy] = await lucid.utxosByOutRef([
    applied.discoveryPolicy.initOutRef,
    deployed.scriptsRef.TasteTestPolicy,
  ]);

  const initNodeConfig: InitNodeConfig = {
    initUTXO,
    scripts: {
      nodePolicy: applied.scripts.liquidityPolicy,
      nodeValidator: applied.scripts.liquidityValidator,
    },
    refScripts: {
      nodePolicy,
    },
  };

  const initNodeUnsigned = await initLqNode(lucid, initNodeConfig);

  if (initNodeUnsigned.type == "error") {
    throw initNodeUnsigned.error;
  }

  await saveInitTTTx(initNodeUnsigned.data.toString(), Boolean(emulator));

  if (emulator) {
    await submitInitLiquidityAction(lucid);
  }
};
