import { setTimeout } from "timers/promises";
import dotenv from "dotenv";
dotenv.config();
import {
  Blockfrost,
  chunkArray,
  Lucid,
  multiFold,
  MultiFoldConfig,
  Network,
  parseUTxOsAtScript,
  sortByOutRefWithIndex,
} from "price-discovery-offchain";
import log4js from "log4js";
log4js.configure("log4js.json");
const logger = log4js.getLogger("app");

import applied from "../../applied-scripts.json" assert { type: "json" };
import { loggerDD } from "../logs/datadog-service.js";
import { sortByKeys, sortByOrefWithIndex } from "../utils/misc.js";

const run = async () => {
  const lucid = await Lucid.new(
    new Blockfrost(process.env.API_URL!, process.env.API_KEY),
    process.env.NETWORK as Network
  );

  const readableUTxOs = await parseUTxOsAtScript(
    lucid,
    applied.scripts.discoveryValidator
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
        foldPolicy: applied.scripts.foldPolicy,
        foldValidator: applied.scripts.foldValidator,
      },
    };

    await loggerDD("running multiFold");
    await loggerDD("selecting WALLET_PROJECT_0");

    lucid.selectWalletFromSeed(process.env.WALLET_PROJECT_0!);
    const multiFoldUnsigned = await multiFold(lucid, multiFoldConfig);

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
