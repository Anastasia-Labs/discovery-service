import dotenv from "dotenv";
dotenv.config();
import {
    addCollected,
    AddCollectedConfig,
  initFold,
  InitFoldConfig,
  initLqFold,
  MintingPolicy,
  SpendingValidator,
} from "price-discovery-offchain";
import log4js from "log4js";
log4js.configure("log4js.json");
const logger = log4js.getLogger("app");

import proxyTokenHolder from "../../compiledLiquidity/proxyTokenHolderV1.json" assert { type: "json" }
import applied from "../../../applied-scripts.json" assert { type: "json" };
import { loggerDD } from "../../logs/datadog-service.js";
import { getLucidInstance, selectLucidWallet } from "../../utils/wallet.js";

const run = async () => {
  const lucid = await getLucidInstance();

//   const proxyTokenHolderSpendingValidator: SpendingValidator = {
//     type: "PlutusV2",
//     script: proxyTokenHolder.cborHex
//   }

//   const addr = lucid.utils.validatorToAddress(proxyTokenHolderSpendingValidator);

  const addCollectedConfig: AddCollectedConfig = {
    scripts: {
        collectFoldPolicy: applied.scripts.collectFoldPolicy,
        collectFoldValidator: applied.scripts.collectFoldValidator,
        tokenHolderPolicy: applied.scripts.tokenHolderPolicy,
        tokenHolderValidator: applied.scripts.tokenHolderValidator
    },
  };

  await loggerDD("running addCollected");
  await loggerDD("selecting WALLET_PROJECT_0");

  await selectLucidWallet(0);
  const addCollectedUnsigned = await addCollected(lucid, addCollectedConfig);

  if (addCollectedUnsigned.type == "error") {
    console.log(addCollectedUnsigned.error);
    return;
  }

  const addCollectedSigned = await addCollectedUnsigned.data.sign().complete();
  const addCollectedHash = await addCollectedSigned.submit();
  console.log(`Submitted: ${addCollectedHash}`);
  await lucid.awaitTx(addCollectedHash);
  await loggerDD(`Done!`);
};

await run();
