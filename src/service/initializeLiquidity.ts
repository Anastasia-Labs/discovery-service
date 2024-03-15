import dotenv from "dotenv";
dotenv.config();
import {
  InitNodeConfig,
  InitTokenHolderConfig,
  initLqNode,
  initLqTokenHolder,
} from "price-discovery-offchain";
import log4js from "log4js";
import { writeFile } from 'fs';
log4js.configure("log4js.json");
const logger = log4js.getLogger("app");

import applied from "../../applied-scripts.json" assert { type: "json" };
import refScripts from "../../deployed-policy.json" assert { type: "json" };
import { loggerDD } from "../logs/datadog-service.js";
import { UTxO } from "@anastasia-labs/lucid-cardano-fork";
import { getLucidInstance, selectLucidWallet } from "../utils/wallet.js";

const run = async () => {
  // await loggerDD("running registerStake");
  const lucid = await getLucidInstance();
  await loggerDD("selecting WALLET_PROJECT_2");
  await selectLucidWallet(2);

  // // //NOTE: REGISTER STAKE ADDRESS
  const liquidityStakeRewardAddress = lucid.utils.validatorToRewardAddress({
    type: "PlutusV2",
    script: applied.scripts.collectStake,
  });

  const rewardStakeRewardAddress = lucid.utils.validatorToRewardAddress({
    type: "PlutusV2",
    script: applied.scripts.rewardStake,
  });

  const registerStakeHash = await (
    await (
      await lucid.newTx()
        .registerStake(liquidityStakeRewardAddress!)
        .registerStake(rewardStakeRewardAddress!)
        .complete()
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
    ).find(({ outputIndex }) => outputIndex === applied.projectTokenHolder.initOutRef.outputIndex) as UTxO,
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
  
  const initTokenHolderUnsigned = await initLqTokenHolder(
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
  await loggerDD(`initTokenHolder submitted TxHash: ${initTokenHolderHash}`);

  // // //NOTE: INIT NODE
  const initNodeConfig: InitNodeConfig = {
    initUTXO: (
      await lucid.utxosByOutRef([applied.discoveryPolicy.initOutRef])
    ).find(({ outputIndex }) => outputIndex === applied.discoveryPolicy.initOutRef.outputIndex) as UTxO,
    scripts: {
      nodePolicy: applied.scripts.liquidityPolicy,
      nodeValidator: applied.scripts.liquidityValidator,
    }
  };

  await loggerDD("running initNode");

  await loggerDD("selecting WALLET_PROJECT_0");
  await selectLucidWallet(0);
  const initNodeUnsigned = await initLqNode(lucid, initNodeConfig);

  if (initNodeUnsigned.type == "error") {
    console.log(initNodeUnsigned.error);
    return;
  }

  const unsignedCbor = Buffer.from(initNodeUnsigned.data.txComplete.to_bytes()).toString("hex");
  const signedTransaction = await initNodeUnsigned.data.sign().complete();
  const signedCbor = Buffer.from(signedTransaction.txSigned.to_bytes()).toString("hex");
  const signedTxHash = signedTransaction.toHash();

  writeFile(
    `./init-tx.json`,
    JSON.stringify(
      {
        cbor: unsignedCbor,
        signedCbor,
        txHash: signedTxHash
      },
      undefined,
      2
    ),
    (error) => {
      error
        ? console.log(error)
        : console.log(
            `Init liquidity transaction saved!`
          );
    }
  );
};

await run();
