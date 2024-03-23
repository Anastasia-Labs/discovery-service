import {
  Data,
  Emulator,
  LiquidityRewardFoldDatum,
  LiquiditySetNode,
  Lucid,
  MintingPolicy,
  RewardLiquidityFoldConfig,
  UTxO,
  chunkArray,
  liquidityFoldRewards,
  parseUTxOsAtScript,
  rFold,
  toUnit,
} from "price-discovery-offchain";
import { setTimeout } from "timers/promises";

import { loggerDD } from "../../logs/datadog-service.js";
import {
  getAppliedScripts,
  getDeployedScripts,
  getTasteTestVariables,
} from "../../utils/files.js";
import { sortByKeys, sortByOrefWithIndex } from "../../utils/misc.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const foldLiquidityRewardsAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  const { lpTokenAssetName } = await getTasteTestVariables();
  await selectLucidWallet(lucid, 0);
  const applied = await getAppliedScripts();
  const deployed = await getDeployedScripts();
  const changeAddress = await lucid.wallet.address();
  const readableUTxOs = await parseUTxOsAtScript<LiquiditySetNode>(
    lucid,
    applied.scripts.liquidityValidator,
    "Liquidity",
  );

  const rewardFoldPolicy: MintingPolicy = {
    type: "PlutusV2",
    script: applied.scripts.rewardFoldPolicy,
  };
  const rewardFoldPolicyId = lucid.utils.mintingPolicyToId(rewardFoldPolicy);

  const rewardFoldToken = toUnit(rewardFoldPolicyId, rFold);
  let rewardFoldUtxo = await lucid.utxoByUnit(rewardFoldToken);

  if (!rewardFoldUtxo) {
    throw new Error("We don't have a fold utxo! Run `init-reward:lp`");
  }

  const foldDatum = Data.from(
    rewardFoldUtxo.datum as string,
    LiquidityRewardFoldDatum,
  );
  const firstNode = readableUTxOs.find((utxo) => {
    return utxo.datum.key === foldDatum.currNode.next;
  });

  if (!firstNode) {
    console.log("error head");
    return;
  }

  const lpTokenAssetId = toUnit(process.env.POOL_POLICY_ID!, lpTokenAssetName);
  const unprocessedNodes = readableUTxOs.filter(({ assets }) => {
    return !assets[lpTokenAssetId];
  });

  const nodes = chunkArray(
    sortByKeys(unprocessedNodes, firstNode.datum.key),
    1,
  );

  for (const [index, chunk] of nodes.entries()) {
    console.log(`processing chunk ${index}`);
    const sortedInputs = sortByOrefWithIndex(chunk);

    const feeInput = (await lucid.wallet.getUtxos()).find(
      ({ assets }) => assets.lovelace > 2_000_000n,
    );
    if (!feeInput) {
      throw Error("Could not find a UTxO that had at least 2 ADA in it.");
    }

    const rewardFoldConfig: RewardLiquidityFoldConfig = {
      // disableNativeUplc: emulator ? false : true,
      currenTime: emulator?.now() ?? Date.now(),
      nodeRefInputs: sortedInputs.map((data) => {
        return data.value.outRef;
      }),
      indices: sortedInputs.map((data) => {
        return data.index;
      }),
      feeInput,
      changeAddress,
      scripts: {
        rewardStake: applied.scripts.rewardStake,
        liquidityValidator: applied.scripts.liquidityValidator,
        rewardFoldValidator: applied.scripts.rewardFoldValidator,
        rewardFoldPolicy: applied.scripts.rewardFoldPolicy,
      },
      refInputs: {
        rewardStake: (
          await lucid.provider.getUtxosByOutRef([
            deployed.scriptsRef.RewardStake,
          ])
        )?.[0] as UTxO,
        liquidityValidator: (
          await lucid.provider.getUtxosByOutRef([
            deployed.scriptsRef.TasteTestValidator,
          ])
        )?.[0] as UTxO,
        rewardFoldValidator: (
          await lucid.provider.getUtxosByOutRef([
            deployed.scriptsRef.RewardFoldValidator,
          ])
        )?.[0] as UTxO,
        rewardFoldPolicy: (
          await lucid.provider.getUtxosByOutRef([
            deployed.scriptsRef.RewardFoldPolicy,
          ])
        )?.[0] as UTxO,
      },
      lpTokenAssetId,
      disableNativeUplc: false,
    };

    const multiFoldUnsigned = await liquidityFoldRewards(
      lucid,
      rewardFoldConfig,
    );

    if (multiFoldUnsigned.type == "error") {
      console.log(multiFoldUnsigned.error);
      return;
    }

    try {
      const multiFoldSigned = await multiFoldUnsigned.data.sign().complete();
      const multiFoldHash = await multiFoldSigned.submit();
      await loggerDD(`Submitting: ${multiFoldHash}`);
      await lucid.awaitTx(multiFoldHash);

      while (rewardFoldUtxo.txHash !== multiFoldHash) {
        if (!emulator) {
          await setTimeout(3_000);
        }

        const newFoldUtxo = await lucid.utxoByUnit(
          toUnit(rewardFoldPolicyId, rFold),
        );

        rewardFoldUtxo = newFoldUtxo;
      }
    } catch (e) {
      await loggerDD(
        `Failed to build fold with error: ${(e as Error).message}`,
      );
      await loggerDD(`Trying again...`);
      // offset wallet & blockchain sync
      await setTimeout(20_000);
    }
  }

  await loggerDD(`Done!`);
};
