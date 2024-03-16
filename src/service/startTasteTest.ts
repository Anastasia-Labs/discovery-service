import { Blockfrost, Lucid, Network, UTxO } from "@anastasia-labs/lucid-cardano-fork";

import initTx from "../../init-tx.json" assert { type: "json" };
import { loggerDD } from "../logs/datadog-service.js";
import { selectLucidWallet } from "../utils/wallet.js";

async function submitInitTx() {
    const lucid = await selectLucidWallet(0);

  const initNodeHash = await lucid.provider.submitTx(initTx.signedCbor)
  await lucid.awaitTx(initNodeHash);
  await loggerDD(`initNode generated TxHash: ${initTx.txHash}`);
  await loggerDD(`initNode submitted TxHash: ${initNodeHash}`);
}

submitInitTx();