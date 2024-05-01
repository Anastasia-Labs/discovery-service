import {
  Data,
  Emulator,
  LiquidityFoldDatum,
  LiquiditySetNode,
  Lucid,
  MultiFoldConfig,
  UTxO,
  chunkArray,
  liquidityFoldNodes,
  parseUTxOsAtScript,
  utxosAtScript,
} from "price-discovery-offchain";
import { setTimeout } from "timers/promises";
import "../../utils/env.js";

import { SEED_WALLET_INDEX } from "../../constants/network.js";
import { loggerDD } from "../../logs/datadog-service.js";
import { isDryRun } from "../../utils/args.js";
import {
  getAppliedScripts,
  getPublishedPolicyOutRefs,
} from "../../utils/files.js";
import { sortByKeys, sortByOrefWithIndex } from "../../utils/misc.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const foldLiquidityNodesAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  await selectLucidWallet(lucid, SEED_WALLET_INDEX);
  const applied = await getAppliedScripts();
  const deployed = await getPublishedPolicyOutRefs();
  const changeAddress = await lucid.wallet.address();
  const readableUTxOs = await parseUTxOsAtScript<LiquiditySetNode>(
    lucid,
    applied.scripts.liquidityValidator,
    "Liquidity",
  );

  let foldUtxo: UTxO;
  const foldUtxoRes = await utxosAtScript(
    lucid,
    applied.scripts.collectFoldValidator,
  );
  foldUtxo = foldUtxoRes[0];

  if (!foldUtxo) {
    throw new Error("We don't have a fold utxo! Run `init-fold`");
  }

  const head = readableUTxOs.find((utxo) => {
    const foldDatum = Data.from(foldUtxo.datum as string, LiquidityFoldDatum);

    return utxo.datum.key == foldDatum.currNode.next;
  });

  if (!head) {
    throw new Error("Could not find a head node.");
  }

  const unprocessedNodes = readableUTxOs.filter(({ datum }) => {
    return datum.commitment === 0n;
  });

  if (unprocessedNodes.length === 0 && unprocessedNodes[0].datum.key === null) {
    console.log("You've already finished all folds!");
    return;
  }

  const chunks = chunkArray(sortByKeys(unprocessedNodes, head.datum.key), 35);

  console.log(
    `Found a total of ${unprocessedNodes.length} nodes and ${chunks.length} chunks to process.`,
  );

  let loop = true;
  let chunkIdx = 0;
  while (loop) {
    console.log(
      `Processing chunk at index #${chunkIdx}, out of ${chunks.length} chunks...`,
    );
    const sortedInputs = sortByOrefWithIndex(chunks[chunkIdx]);

    const walletUtxos = await lucid.wallet.getUtxos();
    const feeInput = walletUtxos.find(
      ({ assets }) =>
        assets.lovelace > 2_000_000n && Object.keys(assets).length === 1,
    );

    if (!feeInput) {
      throw Error("Could not find a UTxO that had at least 2 ADA in it.");
    }

    const [ttStateRef, ttValidatorRef, cfValidatorRef] =
      await lucid.provider.getUtxosByOutRef([
        deployed.scriptsRef.TasteTestStakeValidator,
        deployed.scriptsRef.TasteTestValidator,
        deployed.scriptsRef.CollectFoldValidator,
      ]);

    const multiFoldConfig: MultiFoldConfig = {
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
        liquidityValidator: applied.scripts.liquidityValidator,
        collectStake: applied.scripts.collectStake,
        foldPolicy: applied.scripts.collectFoldPolicy,
        foldValidator: applied.scripts.collectFoldValidator,
      },
      refInputs: {
        collectStake: ttStateRef,
        foldValidator: cfValidatorRef,
        liquidityValidator: ttValidatorRef,
      },
    };

    const multiFoldUnsigned = await liquidityFoldNodes(lucid, multiFoldConfig);

    if (multiFoldUnsigned.type == "error") {
      throw multiFoldUnsigned.error;
    }

    try {
      if (isDryRun()) {
        console.log(multiFoldUnsigned.data.toString());
        break;
      }

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

      if (chunkIdx === chunks.length - 1) {
        loop = false;
        console.log("Done!");
      } else {
        chunkIdx++;
        await lucid.awaitTx(multiFoldHash);
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
