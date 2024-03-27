import { Emulator, initLqRewardFold, Lucid } from "price-discovery-offchain";
import "../../utils/env.js";

import { InitLiquidityRewardFoldConfig } from "price-discovery-offchain";
import { loggerDD } from "../../logs/datadog-service.js";
import { getDatumsObject } from "../../utils/emulator.js";
import {
  getAppliedScripts,
  getDeployedScripts,
  getTasteTestVariables,
} from "../../utils/files.js";
import { isDryRun } from "../../utils/misc.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const initLiquidityRewardServiceAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  const applied = await getAppliedScripts();
  const deployed = await getDeployedScripts();
  const { projectTokenAssetName, projectTokenPolicyId, lpTokenAssetName } =
    await getTasteTestVariables();

  const datums = getDatumsObject(emulator);

  const initRewardFoldConfig: InitLiquidityRewardFoldConfig = {
    currenTime: emulator?.now() ?? Date.now(),
    project: {
      policyId: projectTokenPolicyId,
      tokenName: projectTokenAssetName,
      address: process.env.PROJECT_ADDRESS!,
      lpTokenAssetName: lpTokenAssetName,
      lpTokenPolicyId: process.env.POOL_POLICY_ID!,
    },
    datums,
    scripts: {
      liquidityValidator: applied.scripts.liquidityValidator,
      liquidityPolicy: applied.scripts.liquidityPolicy,
      rewardFoldPolicy: applied.scripts.rewardFoldPolicy,
      rewardFoldValidator: applied.scripts.rewardFoldValidator,
      tokenHolderPolicy: applied.scripts.tokenHolderPolicy,
      tokenHolderValidator: applied.scripts.tokenHolderValidator,
    },
    refScripts: {
      rewardFoldPolicy: (
        await lucid.utxosByOutRef([deployed.scriptsRef.RewardFoldPolicy])
      )[0],
      tokenHolderPolicy: (
        await lucid.utxosByOutRef([deployed.scriptsRef.TokenHolderPolicy])
      )[0],
      tokenHolderValidator: (
        await lucid.utxosByOutRef([deployed.scriptsRef.TokenHolderValidator])
      )[0],
    },
  };

  await selectLucidWallet(lucid, 0);
  const initRewardFoldUnsigned = await initLqRewardFold(
    lucid,
    initRewardFoldConfig,
  );

  if (initRewardFoldUnsigned.type == "error") {
    throw initRewardFoldUnsigned.error;
  }

  if (isDryRun()) {
    console.log(initRewardFoldUnsigned.data.toString());
  } else {
    const initRewardFoldSigned = await initRewardFoldUnsigned.data
      .sign()
      .complete();
    const initRewardFoldHash = await initRewardFoldSigned.submit();
    await loggerDD(`Submitting: ${initRewardFoldHash}`);
    await lucid.awaitTx(initRewardFoldHash);
    await loggerDD("Done!");
  }
};
