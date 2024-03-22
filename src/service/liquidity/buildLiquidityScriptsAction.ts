import dotenv from "dotenv";
dotenv.config();

import { writeFile } from "fs/promises";
import {
  Lucid,
  UTxO,
  buildLiquidityScripts,
  toUnit,
} from "price-discovery-offchain";

import distributionFoldValidator from "../../compiledLiquidity/distributionFoldValidator.json" assert { type: "json" };
import distributionFoldPolicy from "../../compiledLiquidity/distributionRewardFoldMint.json" assert { type: "json" };
import collectionFoldPolicy from "../../compiledLiquidity/liquidityFoldMint.json" assert { type: "json" };
import collectionFoldValidator from "../../compiledLiquidity/liquidityFoldValidator.json" assert { type: "json" };
import liquidityPolicy from "../../compiledLiquidity/liquidityMinting.json" assert { type: "json" };
import liquidityStake from "../../compiledLiquidity/liquidityStakeValidator.json" assert { type: "json" };
import tokenHolderPolicy from "../../compiledLiquidity/liquidityTokenHolderMint.json" assert { type: "json" };
import tokenHolderValidator from "../../compiledLiquidity/liquidityTokenHolderValidator.json" assert { type: "json" };
import liquidityValidator from "../../compiledLiquidity/liquidityValidator.json" assert { type: "json" };
import proxyTokenHolderValidator from "../../compiledLiquidity/proxyTokenHolderV1.json" assert { type: "json" };

import { getTasteTestVariables } from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const buildLiquidityScriptsAction = async (
  lucid: Lucid,
  emulatorDeadline?: number,
) => {
  const { projectTokenPolicyId, projectTokenAssetName } =
    await getTasteTestVariables();
  const project0Utxos = await selectLucidWallet(lucid, 0).then(({ wallet }) =>
    wallet.getUtxos(),
  );
  const [wallet1Address, project1Utxos] = await selectLucidWallet(
    lucid,
    1,
  ).then(async ({ wallet }): Promise<[string, UTxO[]]> => {
    return [await wallet.address(), await wallet.getUtxos()];
  });

  const beneficiaryAddress = process.env.BENEFICIARY_ADDRESS!;

  const checkProjectToken = project1Utxos.find((utxo) => {
    return (
      utxo.assets[toUnit(projectTokenPolicyId, projectTokenAssetName)] ===
      BigInt(process.env.PROJECT_AMNT!)
    );
  });

  if (!checkProjectToken) {
    console.log("WALLET_PROJECT_1 project token missing");
    console.log(
      `Send project ${Number(process.env.PROJECT_AMNT!)} token to: `,
      wallet1Address,
    );
    return;
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
      penaltyAddress: beneficiaryAddress,
    },
    rewardFoldValidator: {
      projectCS: projectTokenPolicyId,
      projectLpPolicyId: process.env.POOL_POLICY_ID!,
      projectAddr: beneficiaryAddress,
    },
    proxyTokenHolderValidator: {
      poolPolicyId: process.env.POOL_POLICY_ID!,
    },
    projectTokenHolder: {
      initUTXO: project1Utxos[0],
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

  if (scripts.type == "error") return;

  const currenTime = Date.now();

  const parameters = {
    discoveryPolicy: {
      initOutRef: {
        txHash: project0Utxos[0].txHash,
        outputIndex: project0Utxos[0].outputIndex,
      },
      deadline: deadline,
      penaltyAddress: beneficiaryAddress,
    },
    rewardValidator: {
      projectCS: projectTokenPolicyId,
      projectTN: projectTokenAssetName,
      projectAddr: beneficiaryAddress,
    },
    projectTokenHolder: {
      initOutRef: {
        txHash: project1Utxos[0].txHash,
        outputIndex: project1Utxos[0].outputIndex,
      },
    },
  };

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
};
