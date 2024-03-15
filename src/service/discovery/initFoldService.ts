import dotenv from "dotenv";
dotenv.config();
import {
  Blockfrost,
  initFold,
  InitFoldConfig,
  Lucid,
  Network,
} from "price-discovery-offchain";
import log4js from "log4js";
log4js.configure("log4js.json");
const logger = log4js.getLogger("app");

import applied from "../../../applied-scripts.json" assert { type: "json" };
import { loggerDD } from "../../logs/datadog-service.js";
import { getLucidInstance, selectLucidWallet } from "../../utils/wallet.js";

const run = async () => {
  const lucid = await getLucidInstance();

  //NOTE: INIT FOLD
  const initFoldConfig: InitFoldConfig = {
    scripts: {
      nodeValidator: applied.scripts.discoveryValidator,
      nodePolicy: applied.scripts.discoveryPolicy,
      foldPolicy: applied.scripts.foldPolicy,
      foldValidator: applied.scripts.foldValidator,
    },
  };

  await loggerDD("running initFold");
  await loggerDD("selecting WALLET_PROJECT_0");

  await selectLucidWallet(0);
  const initFoldUnsigned = await initFold(lucid, initFoldConfig);

  if (initFoldUnsigned.type == "error") {
    console.log(initFoldUnsigned.error);
    return;
  }

  const initFoldSigned = await initFoldUnsigned.data.sign().complete();
  const initFoldHash = await initFoldSigned.submit();
  await lucid.awaitTx(initFoldHash);
  await loggerDD(`initFold submitted TxHash: ${initFoldHash}`);
};

await run();
