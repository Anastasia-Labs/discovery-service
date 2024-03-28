import "../../utils/env.js";

import { writeFile } from "fs/promises";
import { Lucid, buildLiquidityScripts, toUnit } from "price-discovery-offchain";

import { getScripts } from "../../utils/scripts.js";

import { getTasteTestVariables } from "../../utils/files.js";
import { isDryRun } from "../../utils/misc.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const buildLiquidityScriptsAction = async (
  lucid: Lucid,
  emulatorDeadline?: number,
) => {
  const {
    collectionFoldPolicy,
    collectionFoldValidator,
    distributionFoldPolicy,
    distributionFoldValidator,
    liquidityPolicy,
    liquidityStake,
    liquidityValidator,
    proxyTokenHolderValidator,
    tokenHolderPolicy,
    tokenHolderValidator,
  } = getScripts();
  const { projectTokenPolicyId, projectTokenAssetName } =
    await getTasteTestVariables();
  const project0Utxos = await selectLucidWallet(lucid, 0).then(({ wallet }) =>
    wallet.getUtxos(),
  );

  const [initUtxo] = await lucid.provider.getUtxosByOutRef([
    {
      txHash: process.env.TT_INIT_UTXO_HASH!,
      outputIndex: Number(process.env.TT_INIT_UTXO_INDEX!),
    },
  ]);

  const [tokenHolderUtxo] = await lucid.provider.getUtxosByOutRef([
    {
      txHash: process.env.TT_INIT_TOKEN_HOLDER_UTXO_HASH!,
      outputIndex: Number(process.env.TT_INIT_TOKEN_HOLDER_UTXO_INDEX!),
    },
  ]);

  const projectTokenUnit = toUnit(projectTokenPolicyId, projectTokenAssetName);
  const projectTokenValid =
    tokenHolderUtxo.assets[projectTokenUnit] ===
    BigInt(process.env.PROJECT_AMNT!);

  if (!projectTokenValid) {
    throw new Error(
      `The provided token holder utxo does not have the required amount of: ${process.env.PROJECT_AMNT}.`,
    );
  }

  const deadline = Number(emulatorDeadline ?? process.env.DEADLINE);
  console.log(
    "Deadline UTC",
    deadline,
    `${new Date(deadline).toLocaleDateString("en-US", { dateStyle: "full" })} at ${new Date(deadline).toLocaleTimeString()}`,
  );

  const scripts = buildLiquidityScripts(lucid, {
    liquidityPolicy: {
      initUTXO: initUtxo,
      deadline: deadline,
      penaltyAddress: process.env.PENALTY_ADDRESS!,
    },
    rewardFoldValidator: {
      projectCS: projectTokenPolicyId,
      projectLpPolicyId: process.env.POOL_POLICY_ID!,
      projectAddr: process.env.PROJECT_ADDRESS!,
    },
    proxyTokenHolderValidator: {
      poolPolicyId: process.env.POOL_POLICY_ID!,
    },
    projectTokenHolder: {
      initUTXO: tokenHolderUtxo,
    },
    unapplied: {
      liquidityPolicy: liquidityPolicy.cborHex,
      liquidityValidator: liquidityValidator.cborHex,
      liquidityStake: liquidityStake.cborHex,
      collectFoldPolicy: collectionFoldPolicy.cborHex,
      collectFoldValidator: collectionFoldValidator.cborHex,
      distributionFoldPolicy: distributionFoldPolicy.cborHex,
      distributionFoldValidator: distributionFoldValidator.cborHex,
      tokenHolderPolicy: tokenHolderPolicy.cborHex,
      tokenHolderValidator: tokenHolderValidator.cborHex,
      proxyTokenHolderValidator: proxyTokenHolderValidator.cborHex,
    },
  });

  if (scripts.type == "error") {
    throw scripts.error;
  }

  const currenTime = Date.now();

  const parameters = {
    discoveryPolicy: {
      initOutRef: {
        txHash: initUtxo.txHash,
        outputIndex: initUtxo.outputIndex,
      },
      deadline: deadline,
      penaltyAddress: process.env.PENALTY_ADDRESS!,
    },
    rewardValidator: {
      projectCS: projectTokenPolicyId,
      projectTN: projectTokenAssetName,
      projectAddr: process.env.PROJECT_ADDRESS!,
    },
    projectTokenHolder: {
      initOutRef: {
        txHash: tokenHolderUtxo.txHash,
        outputIndex: tokenHolderUtxo.outputIndex,
      },
    },
  };

  const scriptHashes = Object.entries(scripts.data).reduce(
    (acc, [key, script]) => {
      acc[key] = lucid.utils.validatorToScriptHash({
        type: key === "proxyTokenHolderValidator" ? "PlutusV1" : "PlutusV2",
        script,
      });
      return acc;
    },
    {} as Record<string, string>,
  );

  const data = JSON.stringify(
    {
      ...{ scripts: scripts.data, scriptHashes },
      ...{ version: currenTime },
      ...{ projectAmount: Number(process.env.PROJECT_AMNT) },
      ...parameters,
    },
    undefined,
    2,
  );

  if (isDryRun()) {
    console.log(data);
  } else {
    await writeFile(`./applied-scripts.json`, data);

    console.log(`Scripts have been saved , version ${currenTime}\n`);
  }
};
