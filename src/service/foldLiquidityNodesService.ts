import { setTimeout } from "timers/promises";
import dotenv from "dotenv";
dotenv.config();
import {
  chunkArray,
  multiLqFold,
  MultiFoldConfig,
  parseUTxOsAtScript,
} from "price-discovery-offchain";
import log4js from "log4js";
log4js.configure("log4js.json");
const logger = log4js.getLogger("app");

import applied from "../../applied-scripts.json" assert { type: "json" };
import { loggerDD } from "../logs/datadog-service.js";
import { sortByKeys, sortByOrefWithIndex } from "../utils/misc.js";
import { getLucidInstance, selectLucidWallet } from "../utils/wallet.js";

const run = async () => {
  const lucid = await getLucidInstance();
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
  const nodes = chunkArray(sortByKeys(readableUTxOs, head.datum.next), 8)
  console.log("nodes", nodes)

  for (const [index, chunk] of nodes.entries()) {
    // offset wallet & blockchain sync
    await setTimeout(20_000);
    console.log(`processing chunk ${index}`);
    console.log(chunk)
    const sortedInputs = sortByOrefWithIndex(chunk);
    console.log(sortedInputs)

    const multiFoldConfig: MultiFoldConfig = {
      nodeRefInputs: sortedInputs.map((data) => {
        return data.value.outRef;
      }),
      indices: sortedInputs.map((data) => {
        return data.index;
      }),
      scripts: {
        foldPolicy: applied.scripts.collectFoldPolicy,
        foldValidator: applied.scripts.collectFoldValidator,
      },
    };

    await loggerDD("running multiFold");
    await loggerDD("selecting WALLET_PROJECT_0");

    await selectLucidWallet(0);
    const multiFoldUnsigned = await multiLqFold(lucid, multiFoldConfig);

    if (multiFoldUnsigned.type == "error") {
      console.log(multiFoldUnsigned.error);
      return;
    }

    // console.log(initNodeUnsigned.data.txComplete.to_json());
    const multiFoldSigned = await multiFoldUnsigned.data.sign().complete();
    console.log(Buffer.from(multiFoldSigned.txSigned.body().to_bytes()).toString("hex"))
    // const multiFoldHash = await multiFoldSigned.submit();
    // await lucid.awaitTx(multiFoldHash);
    // await loggerDD(`multiFold submitted TxHash: ${multiFoldHash}`);
  }
};

await run();
