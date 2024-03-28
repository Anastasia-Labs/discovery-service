import "../../utils/env.js";

import {
  InitNodeConfig,
  Lucid,
  UTxO,
  initLqNode,
} from "price-discovery-offchain";

import { writeFile } from "fs/promises";
import { loggerDD } from "../../logs/datadog-service.js";
import { getAppliedScripts } from "../../utils/files.js";
import { isDryRun } from "../../utils/misc.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const initializeLiquidityAction = async (lucid: Lucid) => {
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

  const registerStakeTx = await lucid
    .newTx()
    .registerStake(liquidityStakeRewardAddress!)
    .registerStake(rewardStakeRewardAddress!)
    .complete();

  if (isDryRun()) {
    console.log(registerStakeTx.toString());
  } else {
    const registerStakeSignedTx = await registerStakeTx.sign().complete();
    const registerStakeHash = await registerStakeSignedTx.submit();

    await loggerDD(`Submitting Registration: ${registerStakeHash}`);
    await lucid.awaitTx(registerStakeHash);
  }

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

  if (isDryRun()) {
    console.log(initNodeUnsigned.data.toString());
    return;
  }

  await loggerDD(`Building initNode Tx...`);
  const signedTransaction = await initNodeUnsigned.data.sign().complete();
  const signedCbor = Buffer.from(
    signedTransaction.txSigned.to_bytes(),
  ).toString("hex");
  const signedTxHash = signedTransaction.toHash();

  await writeFile(
    `./init-tx.json`,
    JSON.stringify(
      {
        cbor: initNodeUnsigned.data.toString(),
        signedCbor,
        txHash: signedTxHash,
      },
      undefined,
      2,
    ),
  );

  console.log(`Done!`);
};
