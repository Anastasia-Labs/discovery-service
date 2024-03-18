import { setTimeout } from "timers/promises";
import dotenv from "dotenv";
dotenv.config();
import {
  chunkArray,
  multiLqFold,
  MultiFoldConfig,
  parseUTxOsAtScript,
  UTxO,
  LiquidityFoldDatum,
  Data,
  LiquiditySetNode,
  utxosAtScript,
} from "price-discovery-offchain";
import log4js from "log4js";
log4js.configure("log4js.json");
const logger = log4js.getLogger("app");

import applied from "../../../applied-scripts.json" assert { type: "json" };
import { loggerDD } from "../../logs/datadog-service.js";
import { sortByKeys, sortByOrefWithIndex } from "../../utils/misc.js";
import { getLucidInstance, selectLucidWallet } from "../../utils/wallet.js";

const run = async () => {
  const lucid = await selectLucidWallet(0);
  const changeAddress = await lucid.wallet.address();
  const [foldUtxo] = await utxosAtScript(
    lucid,
    applied.scripts.collectFoldValidator
  )
  const readableUTxOs = await parseUTxOsAtScript<LiquiditySetNode>(
    lucid,
    applied.scripts.liquidityValidator,
    "Liquidity"
  );

  if (!foldUtxo) {
    throw new Error("We don't have a fold utxo! Run `init-fold:lp`")
  }

  const head = readableUTxOs.find((utxo) => {
    const foldDatum = Data.from(foldUtxo.datum as string, LiquidityFoldDatum);

    return utxo.datum.key == foldDatum.currNode.next;
  });

  console.log(head?.outRef)

  if (!head) {
    console.log("error head");
    return;
  }

  /**
   * @todo
   * Increase chunk from 2 to 8
   */
  const unprocessedNodes = readableUTxOs.filter(({ datum }) => {
    return datum.commitment === 0n;
  })

  const nodes = chunkArray(sortByKeys(unprocessedNodes, head.datum.key), 2)

  for (const [index, chunk] of nodes.entries()) {
    console.log(`processing chunk ${index}`);
    const sortedInputs = sortByOrefWithIndex(chunk);
    
    const feeInput = (await lucid.wallet.getUtxos()).find(({ assets }) => assets.lovelace > 2_000_000n);
    if (!feeInput) {
      throw Error("Could not find a UTxO that had at least 2 ADA in it.")
    }

    const multiFoldConfig: MultiFoldConfig = {
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
    };

    await loggerDD("running multiFold");
    await loggerDD("selecting WALLET_PROJECT_0");

    const multiFoldUnsigned = await multiLqFold(lucid, multiFoldConfig);

    if (multiFoldUnsigned.type == "error") {
      console.log(multiFoldUnsigned.error);
      return;
    }

    try {
      const multiFoldSigned = await multiFoldUnsigned.data.sign().complete();
      // const multiFoldHash = await multiFoldSigned.submit();
      // await loggerDD(`Submitting: ${multiFoldHash}`);
      // await lucid.awaitTx(multiFoldHash);
      await loggerDD(`Done!`);
    } catch (e) {
      await loggerDD(`Failed to build fold with error: ${(e as Error).message}`);
      await loggerDD(`Trying again...`)
      // offset wallet & blockchain sync
      await setTimeout(20_000);
    }
  }
};

await run();
