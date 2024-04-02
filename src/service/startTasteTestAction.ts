import { Lucid } from "price-discovery-offchain";
import "../utils/env.js";

import { loggerDD } from "../logs/datadog-service.js";
import { isDryRun } from "../utils/args.js";
import { selectLucidWallet } from "../utils/wallet.js";

export async function startTasteTest(lucid: Lucid) {
  const { default: initTx } = await import("../../init-tx.json", {
    assert: { type: "json" },
  });

  if (isDryRun()) {
    console.log(
      `This has already been built, so you can submit it. But here it is: ${initTx.cbor}`,
    );
    return;
  }

  await selectLucidWallet(lucid, 0);
  const initNodeHash = await lucid.provider.submitTx(initTx.signedCbor);
  await loggerDD(`Submitting: ${initTx.txHash}`);
  await lucid.awaitTx(initNodeHash);
  await loggerDD(`Done!`);
}
