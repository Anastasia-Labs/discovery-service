import dotenv from "dotenv";
dotenv.config();
import {
  Blockfrost,
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

const run = async () => {
  const lucid = await Lucid.new(
    new Blockfrost(process.env.API_URL!, process.env.API_KEY),
    process.env.NETWORK as Network
  );

  const sortedInputs = sortByOutRefWithIndex(
    await parseUTxOsAtScript(lucid, applied.scripts.discoveryValidator)
  );

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
};

await run();
