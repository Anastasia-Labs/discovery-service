import {
  Data,
  Emulator,
  LiquidityRewardFoldDatum,
  LiquiditySetNode,
  Lucid,
  MintingPolicy,
  RewardLiquidityFoldConfig,
  chunkArray,
  liquidityFoldRewards,
  parseUTxOsAtScript,
  rFold,
  toUnit,
} from "price-discovery-offchain";
import { setTimeout } from "timers/promises";
import "../../utils/env.js";

import { loggerDD } from "../../logs/datadog-service.js";
import { isDryRun } from "../../utils/args.js";
import {
  getAppliedScripts,
  getPublishedPolicyOutRefs,
  getTTConfig,
  getTTVariables,
} from "../../utils/files.js";
import { sortByKeys, sortByOrefWithIndex } from "../../utils/misc.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const foldLiquidityRewardsAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  const { lpTokenAssetName } = await getTTVariables();
  const { v1PoolData } = await getTTConfig();
  await selectLucidWallet(lucid, 0);
  const applied = await getAppliedScripts();
  const deployed = await getPublishedPolicyOutRefs();
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
    throw new Error("Could not find a first node to begin with.");
  }

  const lpTokenAssetId = toUnit(v1PoolData.policyId, lpTokenAssetName);
  const unprocessedNodes = readableUTxOs.filter(({ assets }) => {
    return !assets[lpTokenAssetId];
  });

  const chunks = chunkArray(
    sortByKeys(unprocessedNodes, firstNode.datum.key),
    35,
  );

  const [ttValidatorRef, rwStakeRef, rwPolicyRef, rwValidatorRef] =
    await lucid.provider.getUtxosByOutRef([
      deployed.scriptsRef.TasteTestValidator,
      deployed.scriptsRef.RewardStake,
      deployed.scriptsRef.RewardFoldPolicy,
      deployed.scriptsRef.RewardFoldValidator,
    ]);

  console.log(`Found a total of ${chunks.length} chunks to process.`);
  for (const [index, chunk] of chunks.entries()) {
    console.log(
      `Processing chunk at index #${index} out of ${chunks.length} chunks...`,
    );
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
        rewardStake: rwStakeRef,
        rewardFoldPolicy: rwPolicyRef,
        rewardFoldValidator: rwValidatorRef,
        liquidityValidator: ttValidatorRef,
      },
      lpTokenAssetId,
      disableNativeUplc: !Boolean(emulator),
    };

    const multiFoldUnsigned = await liquidityFoldRewards(
      lucid,
      rewardFoldConfig,
    );

    if (multiFoldUnsigned.type == "error") {
      throw multiFoldUnsigned.error;
    }

    if (isDryRun()) {
      console.log(multiFoldUnsigned.data.toString());
      continue;
    } else {
      try {
        const multiFoldSigned = await multiFoldUnsigned.data.sign().complete();
        const multiFoldHash = await multiFoldSigned.submit();
        await loggerDD(`Submitting: ${multiFoldHash}`);
        await lucid.awaitTx(multiFoldHash);

        while (rewardFoldUtxo.txHash !== multiFoldHash) {
          await setTimeout(3_000);

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
  }

  await loggerDD(`Done!`);
};
