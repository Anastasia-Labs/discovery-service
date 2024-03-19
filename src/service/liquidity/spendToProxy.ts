import dotenv from "dotenv";
dotenv.config();
import {
    spendToProxy,
    SpendToProxyConfig,
    utxosAtScript,
} from "price-discovery-offchain";
import log4js from "log4js";
log4js.configure("log4js.json");
const logger = log4js.getLogger("app");

import proxyTokenHolder from "../../compiledLiquidity/proxyTokenHolderV1.json" assert { type: "json" }
import applied from "../../../applied-scripts.json" assert { type: "json" };
import deployed from "../../../deployed-policy.json" assert { type: "json" };
import { loggerDD } from "../../logs/datadog-service.js";
import { getLucidInstance, selectLucidWallet } from "../../utils/wallet.js";

const run = async () => {
  const lucid = await getLucidInstance();
  const liquidityTokenHolderInputs = await utxosAtScript(
    lucid,
    applied.scripts.tokenHolderValidator
  )

  const spendToProxyConfig: SpendToProxyConfig = {
    scripts: {
        proxyTokenHolderV1Validator: proxyTokenHolder.cborHex
    },
    refScripts: {
        liquidityTokenHolderPolicy: deployed.scriptsRef.TokenHolderPolicy,
        liquidityTokenHolderValidator: deployed.scriptsRef.TokenHolderValidator
    },
    liquidityTokenHolderInputs
  };

  await loggerDD("running spendToProxy");
  await loggerDD("selecting WALLET_PROJECT_0");

  await selectLucidWallet(0);
  const spendToProxyUnsigned = await spendToProxy(lucid, spendToProxyConfig);

  if (spendToProxyUnsigned.type == "error") {
    console.log(spendToProxyUnsigned.error);
    return;
  }

  const spendToProxySigned = await spendToProxyUnsigned.data.sign().complete();
  const spendToProxyHash = await spendToProxySigned.submit();
  console.log(`Submitted: ${spendToProxyHash}`);
  await lucid.awaitTx(spendToProxyHash);
  await loggerDD(`Done!`);
};

await run();
