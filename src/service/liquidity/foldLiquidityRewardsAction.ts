import {
  Data,
  Emulator,
  LiquidityFoldDatum,
  LiquiditySetNode,
  Lucid,
  RewardLiquidityFoldConfig,
  UTxO,
  chunkArray,
  liquidityFoldRewards,
  parseUTxOsAtScript,
  utxosAtScript,
} from "price-discovery-offchain";
import { setTimeout } from "timers/promises";

import { loggerDD } from "../../logs/datadog-service.js";
import { getAppliedScripts, getDeployedScripts } from "../../utils/files.js";
import { sortByKeys, sortByOrefWithIndex } from "../../utils/misc.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const foldLiquidityRewardsAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  await selectLucidWallet(lucid, 0);
  const applied = await getAppliedScripts();
  const deployed = await getDeployedScripts();
  const changeAddress = await lucid.wallet.address();
  const readableUTxOs = await parseUTxOsAtScript<LiquiditySetNode>(
    lucid,
    applied.scripts.liquidityValidator,
    "Liquidity",
  );

  let foldUtxo: UTxO;
  const foldUtxoRes = await utxosAtScript(
    lucid,
    applied.scripts.rewardFoldValidator,
  );
  foldUtxo = foldUtxoRes[0];

  if (!foldUtxo) {
    throw new Error("We don't have a fold utxo! Run `init-reward:lp`");
  }

  const head = readableUTxOs.find((utxo) => {
    const foldDatum = Data.from(foldUtxo.datum as string, LiquidityFoldDatum);
    return utxo.datum.key == foldDatum.currNode.next;
  });

  if (!head) {
    console.log("error head");
    return;
  }

  /**
   * @todo
   * ask philip
   */
  const unprocessedNodes = readableUTxOs.filter(({ datum }) => {
    return datum.commitment === 0n;
  });

  const nodes = chunkArray(sortByKeys(unprocessedNodes, head.datum.key), 25);

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
      projectAddress: "",
      projectCS: "",
      projectTN: "",
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

      while (foldUtxo.txHash !== multiFoldHash) {
        if (!emulator) {
          await setTimeout(3_000);
        }
        const [newFoldUtxo] = await utxosAtScript(
          lucid,
          applied.scripts.collectFoldValidator,
        );

        foldUtxo = newFoldUtxo;
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
