import dotenv from "dotenv";
dotenv.config();
import {
    spendToProxy,
    SpendToProxyConfig,
    utxosAtScript,
} from "price-discovery-offchain";
import { Lucid, Emulator } from "price-discovery-offchain";

import { loggerDD } from "../../logs/datadog-service.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const spendToProxyAction = async (lucid: Lucid, emulator?: Emulator) => {
  const { default: proxyTokenHolder } = await import("../../compiledLiquidity/proxyTokenHolderV1.json", { assert: { type: "json" } });
  const { default: applied } = await import("../../../applied-scripts.json", { assert: { type: "json" } });
  const { default: deployed } = await import("../../../deployed-policy.json", { assert: { type: "json" } });
  
  const liquidityTokenHolderInputs = await utxosAtScript(
    lucid,
    applied.scripts.tokenHolderValidator
  )

  const spendToProxyConfig: SpendToProxyConfig = {
    currenTime: emulator?.now() ?? Date.now(),
    scripts: {
        proxyTokenHolderV1Validator: proxyTokenHolder.cborHex
    },
    refScripts: {
        liquidityTokenHolderPolicy: deployed.scriptsRef.TokenHolderPolicy,
        liquidityTokenHolderValidator: deployed.scriptsRef.TokenHolderValidator
    },
    liquidityTokenHolderInputs
  };

  await selectLucidWallet(lucid, 0);
  const spendToProxyUnsigned = await spendToProxy(lucid, spendToProxyConfig);

  if (spendToProxyUnsigned.type == "error") {
    console.log(spendToProxyUnsigned.error);
    return;
  }

  const spendToProxySigned = await spendToProxyUnsigned.data.txComplete.sign().complete();
  const spendToProxyHash = await spendToProxySigned.submit();
  console.log(`Submitting proxy transaction: ${spendToProxyHash}`);
  await lucid.awaitTx(spendToProxyHash);
  await loggerDD(`Done!`);

  return spendToProxyUnsigned.data.datum;
};
