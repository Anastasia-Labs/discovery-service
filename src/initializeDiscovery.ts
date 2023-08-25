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

import applied from "../applied-scripts.json" assert { type: "json" };
import refScripts from "../deployed-policy.json" assert { type: "json" };

const run = async () => {
  const lucid = await Lucid.new(
    new Blockfrost(process.env.API_URL!, process.env.API_KEY),
    process.env.NETWORK as Network
  );
  lucid.selectWalletFromSeed(process.env.WALLET_PROJECT_2!);

  //NOTE: REGISTER STAKE ADDRESS
  const discoveryStakeRewardAddress = lucid.utils.validatorToRewardAddress({
    type: "PlutusV2",
    script: applied.scripts.discoveryStake,
  });
  logger.info("running registerStake")

  const registerStakeHash = await (
    await (
      await lucid.newTx().registerStake(discoveryStakeRewardAddress!).complete()
    )
      .sign()
      .complete()
  ).submit();
  await lucid.awaitTx(registerStakeHash);
  logger.info("registerStake submitted TxHash: ", registerStakeHash);
  console.log("registerStake submitted TxHash: ", registerStakeHash);

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

  logger.info("running initTokenHolder")

  lucid.selectWalletFromSeed(process.env.WALLET_PROJECT_1!);
  const initTokenHolderUnsigned = await initTokenHolder(
    lucid,
    initTokenHolderConfig
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
  logger.info("initTokenHolder submitted TxHash: ", initTokenHolderHash);
  console.log("initTokenHolder submitted TxHash: ", initTokenHolderHash);

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

  logger.info("running initNode")

  lucid.selectWalletFromSeed(process.env.WALLET_BENEFICIARY_1!);
  const initNodeUnsigned = await initNode(lucid, initNodeConfig);

  if (initNodeUnsigned.type == "error") {
    console.log(initNodeUnsigned.error);
    return;
  }

  // console.log(initNodeUnsigned.data.txComplete.to_json());
  const initNodeSigned = await initNodeUnsigned.data.sign().complete();
  const initNodeHash = await initNodeSigned.submit();
  await lucid.awaitTx(initNodeHash);
  logger.info("initNode submitted TxHash: ", initNodeHash);
  console.log("initNode submitted TxHash: ", initNodeHash);
};

await run();
