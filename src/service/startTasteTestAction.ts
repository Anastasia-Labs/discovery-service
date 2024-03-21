import { Lucid } from "price-discovery-offchain";

import { loggerDD } from "../logs/datadog-service.js";
import { selectLucidWallet } from "../utils/wallet.js";

export async function startTasteTest(lucid: Lucid) {
  const { default: initTx } = await import("../../init-tx.json", {
    assert: { type: "json" },
  });

  await selectLucidWallet(lucid, 0);
  const initNodeHash = await lucid.provider.submitTx(initTx.signedCbor);
  await loggerDD(`Submitting: ${initTx.txHash}`);
  await lucid.awaitTx(initNodeHash);
  await loggerDD(`Done!`);
}
