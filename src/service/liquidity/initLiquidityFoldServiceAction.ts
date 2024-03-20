import dotenv from "dotenv";
dotenv.config();
import {
  InitFoldConfig,
  initLqFold,
} from "price-discovery-offchain";
import { Emulator, Lucid } from "price-discovery-offchain"

import { loggerDD } from "../../logs/datadog-service.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const initFoldServiceAction = async (lucid: Lucid, emulator?: Emulator) => {
  const { default: applied } = await import("../../../applied-scripts.json", { assert: { type: "json" } })

  const initFoldConfig: InitFoldConfig = {
    currenTime: emulator?.now() ?? Date.now(),
    scripts: {
      nodeValidator: applied.scripts.liquidityValidator,
      nodePolicy: applied.scripts.liquidityPolicy,
      foldPolicy: applied.scripts.collectFoldPolicy,
      foldValidator: applied.scripts.collectFoldValidator,
    }
  };

  await selectLucidWallet(lucid, 0);
  const initFoldUnsigned = await initLqFold(lucid, initFoldConfig);

  if (initFoldUnsigned.type == "error") {
    console.log(initFoldUnsigned.error);
    return;
  }

  const initFoldSigned = await initFoldUnsigned.data.sign().complete();
  const initFoldHash = await initFoldSigned.submit();
  console.log(`Submitting: ${initFoldHash}`);
  await lucid.awaitTx(initFoldHash);
  await loggerDD(`Done!`);
};
