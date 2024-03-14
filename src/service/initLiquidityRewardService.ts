import dotenv from "dotenv";
dotenv.config();
import {
  Blockfrost,
  initRewardFold,
  InitRewardFoldConfig,
  Lucid,
  Network,
} from "price-discovery-offchain";
import log4js from "log4js";
log4js.configure("log4js.json");
const logger = log4js.getLogger("app");

import applied from "../../applied-scripts.json" assert { type: "json" };
import refScripts from "../../deployed-policy.json" assert { type: "json" };
import {loggerDD} from "../logs/datadog-service.js";
import { getLucidInstance, selectLucidWallet } from "../utils/wallet.js";

const run = async () => {
  const lucid = await getLucidInstance();

  const initRewardFoldConfig: InitRewardFoldConfig = {
    projectCS: process.env.PROJECT_CS!,
    projectTN: process.env.PROJECT_TN!,
    scripts: {
      nodeValidator: applied.scripts.liquidityValidator,
      nodePolicy: applied.scripts.liquidityPolicy,
      foldPolicy: applied.scripts.collectFoldPolicy,
      foldValidator: applied.scripts.collectFoldValidator,
      rewardFoldPolicy: applied.scripts.rewardFoldPolicy,
      rewardFoldValidator: applied.scripts.rewardFoldValidator,
      tokenHolderPolicy: applied.scripts.tokenHolderPolicy,
      tokenHolderValidator: applied.scripts.tokenHolderValidator,
    },
    refScripts: {
      nodePolicy: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.TasteTestPolicy])
      )[0],
      nodeValidator: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.TasteTestValidator])
      )[0],
      commitFoldPolicy: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.CollectFoldPolicy])
      )[0],
      commitFoldValidator: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.CollectFoldValidator])
      )[0],
      rewardFoldPolicy: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.RewardFoldPolicy])
      )[0],
      rewardFoldValidator: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.RewardFoldValidator])
      )[0],
      tokenHolderPolicy: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.TokenHolderPolicy])
      )[0],
      tokenHolderValidator: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.TokenHolderValidator])
      )[0],
    },
  };
  await loggerDD("running initRewardFold")
  await loggerDD("selecting WALLET_PROJECT_0");

  await selectLucidWallet(0);
  const initRewardFoldUnsigned = await initRewardFold(
    lucid,
    initRewardFoldConfig
  );

  if (initRewardFoldUnsigned.type == "error") {
    console.log(initRewardFoldUnsigned.error);
    return;
  }

  const initRewardFoldSigned = await initRewardFoldUnsigned.data
    .sign()
    .complete();
    console.log(Buffer.from(initRewardFoldSigned.txSigned.body().to_bytes()).toString("hex"))
//   const initRewardFoldHash = await initRewardFoldSigned.submit();
//   await lucid.awaitTx(initRewardFoldHash);
//   await loggerDD(`initRewardFold submitted TxHash: ${ initRewardFoldHash }`)
};

await run();
