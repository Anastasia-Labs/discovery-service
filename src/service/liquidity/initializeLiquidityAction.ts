import dotenv from "dotenv";
dotenv.config();

import { writeFileSync } from "fs";
import {
  InitNodeConfig,
  InitTokenHolderConfig,
  Lucid,
  UTxO,
  initLqNode,
  initLqTokenHolder,
} from "price-discovery-offchain";

import inquirer from "inquirer";
import { loggerDD } from "../../logs/datadog-service.js";
import { getAppliedScripts } from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const initializeLiquidityAction = async (
  lucid: Lucid,
  externalTokenProvider?: boolean,
) => {
  await selectLucidWallet(lucid, 2);
  const applied = await getAppliedScripts();

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
      await lucid
        .newTx()
        .registerStake(liquidityStakeRewardAddress!)
        .registerStake(rewardStakeRewardAddress!)
        .complete()
    )
      .sign()
      .complete()
  ).submit();

  await loggerDD(`Submitting Registration: ${registerStakeHash}`);
  await lucid.awaitTx(registerStakeHash);

  const tokenHolderUtxo = await lucid.utxosByOutRef([
    applied.projectTokenHolder.initOutRef,
  ]);
  const initUtxo = tokenHolderUtxo.find(
    ({ outputIndex }) =>
      outputIndex === applied.projectTokenHolder.initOutRef.outputIndex,
  ) as UTxO;

  if (!initUtxo) {
    throw new Error(
      "Aborting. Could not find an initUTXO to initialize the token holder with!",
    );
  }

  let collectFrom: UTxO[] | undefined;
  if (externalTokenProvider) {
    const [address, tokenAsset] = await inquirer.prompt([
      {
        message: "What is the user's wallet address?",
      },
      {
        message: "What is the token asset ID?",
      },
    ]);

    if (!address || !tokenAsset) {
      throw new Error("Can not initialize token holder with empty values.");
    }

    collectFrom = await lucid.provider.getUtxosWithUnit(address, tokenAsset);
  } else {
    // Collect from our own wallet.
    await selectLucidWallet(lucid, 1);
  }

  const initTokenHolderConfig: InitTokenHolderConfig = {
    initUTXO: initUtxo,
    projectCS: applied.rewardValidator.projectCS,
    projectTN: applied.rewardValidator.projectTN,
    projectAmount: Number(process.env.PROJECT_AMNT),
    scripts: {
      tokenHolderPolicy: applied.scripts.tokenHolderPolicy,
      tokenHolderValidator: applied.scripts.tokenHolderValidator,
    },
  };

  const initTokenHolderUnsigned = await initLqTokenHolder(
    lucid,
    initTokenHolderConfig,
  );

  if (initTokenHolderUnsigned.type === "error") {
    throw initTokenHolderUnsigned.error;
  }

  if (externalTokenProvider) {
    // print file
  } else {
    const initTokenHolderSigned = await initTokenHolderUnsigned.data
      .sign()
      .complete();
    const initTokenHolderHash = await initTokenHolderSigned.submit();
    await loggerDD(`Submitting TokenHolder: ${initTokenHolderHash}`);
    await lucid.awaitTx(initTokenHolderHash);
  }

  // // //NOTE: INIT NODE
  const initNodeConfig: InitNodeConfig = {
    initUTXO: (
      await lucid.utxosByOutRef([applied.discoveryPolicy.initOutRef])
    ).find(
      ({ outputIndex }) =>
        outputIndex === applied.discoveryPolicy.initOutRef.outputIndex,
    ) as UTxO,
    scripts: {
      nodePolicy: applied.scripts.liquidityPolicy,
      nodeValidator: applied.scripts.liquidityValidator,
    },
  };

  await selectLucidWallet(lucid, 0);
  const initNodeUnsigned = await initLqNode(lucid, initNodeConfig);

  if (initNodeUnsigned.type == "error") {
    throw initNodeUnsigned.error;
  }

  await loggerDD(`Building initNode Tx...`);
  const unsignedCbor = Buffer.from(
    initNodeUnsigned.data.txComplete.to_bytes(),
  ).toString("hex");
  const signedTransaction = await initNodeUnsigned.data.sign().complete();
  const signedCbor = Buffer.from(
    signedTransaction.txSigned.to_bytes(),
  ).toString("hex");
  const signedTxHash = signedTransaction.toHash();

  writeFileSync(
    `./init-tx.json`,
    JSON.stringify(
      {
        cbor: unsignedCbor,
        signedCbor,
        txHash: signedTxHash,
      },
      undefined,
      2,
    ),
  );

  console.log(`Done!`);
};
