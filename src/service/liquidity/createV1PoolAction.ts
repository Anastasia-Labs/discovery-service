import "../../utils/env.js";

import {
  Emulator,
  Lucid,
  createLiquidityV1Pool,
} from "price-discovery-offchain";
import { getDatumsObject } from "../../utils/emulator.js";
import {
  getAppliedScripts,
  getTasteTestVariables,
  updateTasteTestVariables,
} from "../../utils/files.js";
import { isDryRun } from "../../utils/misc.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const createV1PoolAction = async (lucid: Lucid, emulator?: Emulator) => {
  const applied = await getAppliedScripts();
  const { projectTokenAssetName, projectTokenPolicyId } =
    await getTasteTestVariables();
  await selectLucidWallet(lucid, 0);

  const datums = getDatumsObject(emulator);

  const unsignedTx = await createLiquidityV1Pool(lucid, {
    currenTime: emulator?.now() ?? Date.now(),
    scripts: {
      proxyTokenHolderScript: applied.scripts.proxyTokenHolderValidator,
      v1PoolPolicyScript: process.env.V1_POOL_POLICY_SCRIPT!,
      v1FactoryValidatorScript: process.env.V1_POOL_FACTORY_VALIDATOR!,
      tokenHolderPolicy: applied.scripts.tokenHolderPolicy,
    },
    v1PoolAddress: process.env.POOL_ADDRESS!,
    v1PoolPolicyId: process.env.POOL_POLICY_ID!,
    projectToken: {
      assetName: projectTokenAssetName,
      policyId: projectTokenPolicyId,
    },
    v1FactoryToken: {
      policyId: process.env.V1_FACTORY_TOKEN!.split(".")[0],
      assetName: process.env.V1_FACTORY_TOKEN!.split(".")[1],
    },
    datums,
    emulator: Boolean(emulator),
  });

  if (unsignedTx.type == "error") {
    throw unsignedTx.error;
  }

  if (isDryRun()) {
    console.log(unsignedTx.data.tx.toString());
  } else {
    const signedTx = await unsignedTx.data.tx.sign().complete();
    const txHash = await signedTx.submit();
    console.log(`Submitting: ${txHash}`);
    await lucid.awaitTx(txHash);

    await updateTasteTestVariables({
      lpTokenAssetName: unsignedTx.data.poolLpTokenName,
    });
    console.log("Done! Saved LP token data to taste-test-variables.json.");
  }
};
