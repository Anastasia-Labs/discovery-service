import {
  Emulator,
  InitLiquidityRewardFoldConfig,
  Lucid,
  initLqRewardFold,
} from "price-discovery-offchain";
import "../../utils/env.js";

import { SEED_WALLET_INDEX } from "../../constants/network.js";
import { loggerDD } from "../../logs/datadog-service.js";
import { isDryRun } from "../../utils/args.js";
import { getDatumsObject } from "../../utils/emulator.js";
import {
  getAppliedScripts,
  getInitLiquidityRewardsFoldTx,
  getPublishedPolicyOutRefs,
  getTTConfig,
  getTTVariables,
  saveInitLiquidityRewardsFoldTx,
} from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

const submitInitLiquidityRewardsServiceAction = async (lucid: Lucid) => {
  const submitInitLiquidityRewardsTx = await getInitLiquidityRewardsFoldTx();
  if (!submitInitLiquidityRewardsTx) {
    throw new Error("Could not find an initLiquidityRewardsFoldTx to submit.");
  }

  const initRewardFoldSigned = await lucid
    .fromTx(submitInitLiquidityRewardsTx)
    .sign()
    .complete();
  const initRewardFoldHash = await initRewardFoldSigned.submit();
  await loggerDD(`Submitting: ${initRewardFoldHash}`);
  await lucid.awaitTx(initRewardFoldHash);
  await loggerDD("Done!");
};

export const initLiquidityRewardServiceAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  await selectLucidWallet(lucid, SEED_WALLET_INDEX);

  if (!isDryRun() && !emulator) {
    await submitInitLiquidityRewardsServiceAction(lucid);
    return;
  }

  const applied = await getAppliedScripts();
  const deployed = await getPublishedPolicyOutRefs();
  const { projectTokenAssetName, projectTokenPolicyId, lpTokenAssetName } =
    await getTTVariables();
  const {
    project: { addresses },
    v1PoolData,
  } = await getTTConfig();

  const datums = getDatumsObject(emulator);

  const [
    ttPolicyRef,
    ttValidatorRef,
    rwPolicyRef,
    rwValidatorRef,
    thPolicyRef,
    thValidatorRef,
  ] = await lucid.provider.getUtxosByOutRef([
    deployed.scriptsRef.TasteTestPolicy,
    deployed.scriptsRef.TasteTestValidator,
    deployed.scriptsRef.RewardFoldPolicy,
    deployed.scriptsRef.RewardFoldValidator,
    deployed.scriptsRef.TokenHolderPolicy,
    deployed.scriptsRef.TokenHolderValidator,
  ]);

  const initRewardFoldConfig: InitLiquidityRewardFoldConfig = {
    currenTime: emulator?.now() ?? Date.now(),
    project: {
      policyId: projectTokenPolicyId,
      tokenName: projectTokenAssetName,
      address: addresses.liquidityDestination,
      lpTokenAssetName: lpTokenAssetName,
      lpTokenPolicyId: v1PoolData.policyId,
    },
    datums,
    scripts: {
      liquidityPolicy: applied.scripts.liquidityPolicy,
      liquidityValidator: applied.scripts.liquidityValidator,
      rewardFoldPolicy: applied.scripts.rewardFoldPolicy,
      rewardFoldValidator: applied.scripts.rewardFoldValidator,
      tokenHolderPolicy: applied.scripts.tokenHolderPolicy,
      tokenHolderValidator: applied.scripts.tokenHolderValidator,
    },
    refScripts: {
      liquidityPolicy: ttPolicyRef,
      liquidityValidator: ttValidatorRef,
      rewardFoldPolicy: rwPolicyRef,
      rewardFoldValidator: rwValidatorRef,
      tokenHolderPolicy: thPolicyRef,
      tokenHolderValidator: thValidatorRef,
    },
  };

  const initRewardFoldUnsigned = await initLqRewardFold(
    lucid,
    initRewardFoldConfig,
  );

  if (initRewardFoldUnsigned.type == "error") {
    throw initRewardFoldUnsigned.error;
  }

  await saveInitLiquidityRewardsFoldTx(
    initRewardFoldUnsigned.data.toString(),
    Boolean(emulator),
  );
  if (emulator) {
    await submitInitLiquidityRewardsServiceAction(lucid);
  }
};
