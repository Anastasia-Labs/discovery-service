import "../../utils/env.js";

import { writeFile } from "fs/promises";
import {
  InitNodeConfig,
  Lucid,
  UTxO,
  initLqNode,
} from "price-discovery-offchain";

import { loggerDD } from "../../logs/datadog-service.js";
import { isDryRun } from "../../utils/args.js";
import { getAppliedScripts } from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const initializeLiquidityAction = async (lucid: Lucid) => {
  await selectLucidWallet(lucid, 0);
  const applied = await getAppliedScripts();

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
