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

import applied from "../applied-scripts.json" assert { type: "json" };

const run = async () => {
  const lucid = await Lucid.new(
    new Blockfrost(process.env.API_URL!, process.env.API_KEY),
    process.env.NETWORK as Network
  );

  //NOTE: INIT FOLD
  const initFoldConfig: InitFoldConfig = {
    scripts: {
      nodeValidator: applied.scripts.discoveryValidator,
      nodePolicy: applied.scripts.discoveryPolicy,
      foldPolicy: applied.scripts.foldPolicy,
      foldValidator: applied.scripts.foldValidator,
    },
  };

  logger.info("running initFold")

  lucid.selectWalletFromSeed(process.env.WALLET_BENEFICIARY_1!);
  const initFoldUnsigned = await initFold(lucid, initFoldConfig);

  if (initFoldUnsigned.type == "error") {
    console.log(initFoldUnsigned.error);
    return;
  }

  const initFoldSigned = await initFoldUnsigned.data.sign().complete();
  const initFoldHash = await initFoldSigned.submit();
  await lucid.awaitTx(initFoldHash);
  logger.info("initFold submitted TxHash: ", initFoldHash)
  console.log("initFold submitted TxHash: ", initFoldHash);
};

await run();
