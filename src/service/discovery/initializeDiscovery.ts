import dotenv from "dotenv";
dotenv.config();
import {
  Blockfrost,
  initNode,
  InitNodeConfig,
  initTokenHolder,
  InitTokenHolderConfig,
  Lucid,
  Network,
} from "price-discovery-offchain";
import log4js from "log4js";
log4js.configure("log4js.json");
const logger = log4js.getLogger("app");

import applied from "../../../applied-scripts.json" assert { type: "json" };
import refScripts from "../../../deployed-policy.json" assert { type: "json" };
import { loggerDD } from "../../logs/datadog-service.js";
import { getLucidInstance, selectLucidWallet } from "../../utils/wallet.js";

const run = async () => {
  await loggerDD("running registerStake");
  const lucid = await getLucidInstance();
  await loggerDD("selecting WALLET_PROJECT_2");
  await selectLucidWallet(2);

  //NOTE: REGISTER STAKE ADDRESS
  const discoveryStakeRewardAddress = lucid.utils.validatorToRewardAddress({
    type: "PlutusV2",
    script: applied.scripts.discoveryStake,
  });

  const registerStakeHash = await (
    await (
      await lucid.newTx().registerStake(discoveryStakeRewardAddress!).complete()
    )
      .sign()
      .complete()
  ).submit();
  await lucid.awaitTx(registerStakeHash);
  await loggerDD(`registerStake submitted TxHash: ${registerStakeHash}`);

  //NOTE: INIT PROJECT TOKEN HOLDER
  //WARNING: make sure WALLET_PROJECT_1 has project token amount!!!
  const initTokenHolderConfig: InitTokenHolderConfig = {
    initUTXO: (
      await lucid.utxosByOutRef([applied.projectTokenHolder.initOutRef])
    )[0],
    projectCS: applied.rewardValidator.projectCS,
    projectTN: applied.rewardValidator.projectTN,
    projectAmount: Number(process.env.PROJECT_AMNT), // 100_000 without decimals
    scripts: {
      tokenHolderPolicy: applied.scripts.tokenHolderPolicy,
      tokenHolderValidator: applied.scripts.tokenHolderValidator,
    },
  };

  await loggerDD("running initTokenHolder");

  await loggerDD("selecting WALLET_PROJECT_1");
  await selectLucidWallet(1);
  const initTokenHolderUnsigned = await initTokenHolder(
    lucid,
    initTokenHolderConfig,
  );

  if (initTokenHolderUnsigned.type == "error") {
    console.log(initTokenHolderUnsigned.error);
    return;
  }

  const initTokenHolderSigned = await initTokenHolderUnsigned.data
    .sign()
    .complete();
  const initTokenHolderHash = await initTokenHolderSigned.submit();
  await lucid.awaitTx(initTokenHolderHash);
  await loggerDD(`initTokenHolder submitted TxHash: ${initTokenHolderHash}`);

  //NOTE: INIT NODE
  const initNodeConfig: InitNodeConfig = {
    initUTXO: (
      await lucid.utxosByOutRef([applied.discoveryPolicy.initOutRef])
    )[0],
    scripts: {
      nodePolicy: applied.scripts.discoveryPolicy,
      nodeValidator: applied.scripts.discoveryValidator,
    },
    refScripts: {
      nodePolicy: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.DiscoveryPolicy])
      )[0],
    },
  };

  await loggerDD("running initNode");

  await loggerDD("selecting WALLET_PROJECT_0");
  await selectLucidWallet(0);
  const initNodeUnsigned = await initNode(lucid, initNodeConfig);

  if (initNodeUnsigned.type == "error") {
    console.log(initNodeUnsigned.error);
    return;
  }

  // console.log(initNodeUnsigned.data.txComplete.to_json());
  const initNodeSigned = await initNodeUnsigned.data.sign().complete();
  const initNodeHash = await initNodeSigned.submit();
  await lucid.awaitTx(initNodeHash);
  await loggerDD(`initNode submitted TxHash: ${initNodeHash}`);
};

await run();
