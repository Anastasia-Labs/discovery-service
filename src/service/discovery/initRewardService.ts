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

import applied from "../../../applied-scripts.json" assert { type: "json" };
import refScripts from "../../../deployed-policy.json" assert { type: "json" };
import {loggerDD} from "../../logs/datadog-service.js";
import { getLucidInstance, selectLucidWallet } from "../../utils/wallet.js";

const run = async () => {
  const lucid = await getLucidInstance();

  const initRewardFoldConfig: InitRewardFoldConfig = {
    projectCS: process.env.PROJECT_CS!,
    projectTN: process.env.PROJECT_TN!,
    scripts: {
      nodeValidator: applied.scripts.discoveryValidator,
      nodePolicy: applied.scripts.discoveryPolicy,
      foldPolicy: applied.scripts.foldPolicy,
      foldValidator: applied.scripts.foldValidator,
      rewardFoldPolicy: applied.scripts.rewardPolicy,
      rewardFoldValidator: applied.scripts.rewardValidator,
      tokenHolderPolicy: applied.scripts.tokenHolderPolicy,
      tokenHolderValidator: applied.scripts.tokenHolderValidator,
    },
    refScripts: {
      nodePolicy: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.DiscoveryPolicy])
      )[0],
      nodeValidator: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.DiscoveryValidator])
      )[0],
      commitFoldPolicy: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.FoldPolicy])
      )[0],
      commitFoldValidator: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.FoldValidator])
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
  const initRewardFoldHash = await initRewardFoldSigned.submit();
  await lucid.awaitTx(initRewardFoldHash);
  await loggerDD(`initRewardFold submitted TxHash: ${ initRewardFoldHash }`)
};

await run();
