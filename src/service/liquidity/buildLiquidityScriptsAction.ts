import "../../utils/env.js";

import {
  Emulator,
  Lucid,
  UTxO,
  buildLiquidityScripts,
  toUnit,
} from "price-discovery-offchain";

import { getScripts } from "../../utils/scripts.js";

import { IAppliedScriptsJSON } from "../../@types/json.js";
import {
  MINT_TOKEN_WALLET_INDEX,
  SEED_WALLET_INDEX,
} from "../../constants/network.js";
import {
  getTTConfig,
  getTTVariables,
  saveAppliedScripts,
} from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const buildLiquidityScriptsAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  const config = await getTTConfig();

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
  } = await getScripts();

  const { projectTokenPolicyId, projectTokenAssetName } =
    await getTTVariables();

  let initUtxo: UTxO;
  if (config.reservedUtxos?.initTasteTest) {
    const res = await lucid.provider.getUtxosByOutRef(
      config.reservedUtxos.initTasteTest,
    );

    initUtxo = res[0];
  } else {
    await selectLucidWallet(lucid, SEED_WALLET_INDEX);
    const res = await lucid.wallet.getUtxos();
    initUtxo = res[0];
  }

  let tokenHolderUtxo: UTxO;
  if (config.reservedUtxos?.initTokenHolder) {
    const res = await lucid.provider.getUtxosByOutRef(
      config.reservedUtxos.initTokenHolder,
    );

    tokenHolderUtxo = res[0];
  } else {
    await selectLucidWallet(lucid, MINT_TOKEN_WALLET_INDEX);
    const res = await lucid.wallet.getUtxos();
    tokenHolderUtxo = res[0];
  }

  const projectTokenUnit = toUnit(projectTokenPolicyId, projectTokenAssetName);
  const projectTokenValid =
    tokenHolderUtxo.assets[projectTokenUnit] ===
    BigInt(config.project.token.suppliedAmount);

  if (!projectTokenValid) {
    throw new Error(
      `The provided token holder utxo does not have the required amount of: ${config.project.token.suppliedAmount}.`,
    );
  }

  console.log(
    "Deadline UTC",
    config.deadline,
    `${new Date(config.deadline).toLocaleDateString("en-US", { dateStyle: "full" })} at ${new Date(config.deadline).toLocaleTimeString()}`,
  );

  const scripts = buildLiquidityScripts(lucid, {
    liquidityPolicy: {
      initUTXO: initUtxo,
      deadline: config.deadline,
      penaltyAddress: config.project.addresses.withdrawPenalty,
    },
    rewardFoldValidator: {
      projectCS: projectTokenPolicyId,
      projectLpPolicyId: config.v1PoolData.policyId,
      projectAddr: config.project.addresses.liquidityDestination,
    },
    proxyTokenHolderValidator: {
      poolPolicyId: config.v1PoolData.policyId,
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

  const parameters = {
    discoveryPolicy: {
      initOutRef: {
        txHash: initUtxo.txHash,
        outputIndex: initUtxo.outputIndex,
      },
      deadline: config.deadline,
      penaltyAddress: config.project.addresses.withdrawPenalty,
    },
    rewardValidator: {
      projectCS: projectTokenPolicyId,
      projectTN: projectTokenAssetName,
      projectAddr: config.project.addresses.liquidityDestination,
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

  const data: IAppliedScriptsJSON = {
    scripts: scripts.data,
    scriptHashes:
      scriptHashes as unknown as IAppliedScriptsJSON["scriptHashes"],
    projectAmount: config.project.token.suppliedAmount,
    version: Date.now(),
    ...parameters,
  };

  await saveAppliedScripts(data, Boolean(emulator));
};
