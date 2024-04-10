import "../../utils/env.js";

import {
  Emulator,
  Lucid,
  createLiquidityV1Pool,
} from "price-discovery-offchain";
import { isDryRun } from "../../utils/args.js";
import { getDatumsObject } from "../../utils/emulator.js";
import {
  getAppliedScripts,
  getCreateV1PoolTx,
  getTTConfig,
  getTTVariables,
  saveCreateV1PoolTx,
  updateTTVariables,
} from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

const submitCreateV1PoolAction = async (lucid: Lucid) => {
  const createV1PoolTx = await getCreateV1PoolTx();
  if (!createV1PoolTx) {
    throw new Error("Could not find a createV1Pool transaction to submit.");
  }

  const signedTx = await lucid.fromTx(createV1PoolTx).sign().complete();
  const txHash = await signedTx.submit();
  console.log(`Submitting: ${txHash}`);
  await lucid.awaitTx(txHash);
  console.log("Done!");
};

export const createV1PoolAction = async (lucid: Lucid, emulator?: Emulator) => {
  const { v1PoolData } = await getTTConfig();
  const applied = await getAppliedScripts();
  const { projectTokenAssetName, projectTokenPolicyId } =
    await getTTVariables();
  await selectLucidWallet(lucid, 0);

  if (!isDryRun() && !emulator) {
    await submitCreateV1PoolAction(lucid);
    return;
  }

  const datums = getDatumsObject(emulator);

  const unsignedTx = await createLiquidityV1Pool(lucid, {
    currenTime: emulator?.now() ?? Date.now(),
    scripts: {
      proxyTokenHolderScript: applied.scripts.proxyTokenHolderValidator,
      v1PoolPolicyScript: v1PoolData.policyScriptBytes,
      v1FactoryValidatorScript: v1PoolData.validatorScriptBytes,
      tokenHolderPolicy: applied.scripts.tokenHolderPolicy,
    },
    v1PoolAddress: v1PoolData.address,
    v1PoolPolicyId: v1PoolData.policyId,
    projectToken: {
      assetName: projectTokenAssetName,
      policyId: projectTokenPolicyId,
    },
    v1FactoryToken: {
      policyId: v1PoolData.factoryToken.split(".")[0],
      assetName: v1PoolData.factoryToken.split(".")[1],
    },
    datums,
    emulator: Boolean(emulator),
  });

  if (unsignedTx.type == "error") {
    throw unsignedTx.error;
  }

  await saveCreateV1PoolTx(unsignedTx.data.tx.toString(), Boolean(emulator));
  await updateTTVariables({
    lpTokenAssetName: unsignedTx.data.poolLpTokenName,
  });
  console.log("Done! Saved LP token data to taste-test-variables.json.");

  if (emulator) {
    await submitCreateV1PoolAction(lucid);
  }
};
