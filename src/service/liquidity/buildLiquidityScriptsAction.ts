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

  const projectTokenUnit = toUnit(projectTokenPolicyId, projectTokenAssetName);
  const projectTokenUtxo = await lucid.provider.getUtxoByUnit(projectTokenUnit);
  const projectTokenValid =
    projectTokenUtxo.assets[projectTokenUnit] ===
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
      initUTXO: project0Utxos[0],
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
      initUTXO: projectTokenUtxo,
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
        txHash: project0Utxos[0].txHash,
        outputIndex: project0Utxos[0].outputIndex,
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
        txHash: projectTokenUtxo.txHash,
        outputIndex: projectTokenUtxo.outputIndex,
      },
    },
  };

  const data = JSON.stringify(
    {
      ...{ scripts: scripts.data },
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
    await writeFile(
      `./applied-scripts.json`,
      JSON.stringify(
        {
          ...{ scripts: scripts.data },
          ...{ version: currenTime },
          ...{ projectAmount: Number(process.env.PROJECT_AMNT) },
          ...parameters,
        },
        undefined,
        2,
      ),
    );

    console.log(`Scripts have been saved , version ${currenTime}\n`);
  }
};
