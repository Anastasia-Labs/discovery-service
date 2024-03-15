import { setTimeout } from "timers/promises";
import dotenv from "dotenv";
dotenv.config();
import {
  chunkArray,
  multiLqFold,
  MultiFoldConfig,
  parseUTxOsAtScript,
  UTxO,
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
  const readableUTxOs = await parseUTxOsAtScript(
    lucid,
    applied.scripts.liquidityValidator,
    "Liquidity"
  );

  const head = readableUTxOs.find((utxo) => {
    return utxo.datum.key == null;
  });
  if (!head) {
    console.log("error head");
    return;
  }

  /**
   * @todo
   * Increase chunk from 2 to 8
   */
  const nodes = chunkArray(sortByKeys(readableUTxOs, head.datum.next), 2)
  console.log("nodes", nodes)

  for (const [index, chunk] of nodes.entries()) {
    // offset wallet & blockchain sync
    await setTimeout(20_000);
    console.log(`processing chunk ${index}`);
    // console.log(chunk)
    const sortedInputs = sortByOrefWithIndex(chunk);
    // console.log(sortedInputs)
    
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

    // console.log(initNodeUnsigned.data.txComplete.to_json());
    const multiFoldSigned = await multiFoldUnsigned.data.sign().complete();
    const multiFoldHash = await multiFoldSigned.submit();
    await lucid.awaitTx(multiFoldHash);
    await loggerDD(`multiFold submitted TxHash: ${multiFoldHash}`);
  }
};

await run();
