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
import {
  getAppliedScripts,
  getDeployedScripts,
  getProxyTokenHolderScript,
} from "../../utils/files.js";

export const spendToProxyAction = async (lucid: Lucid, emulator?: Emulator) => {
  const proxyTokenHolder = await getProxyTokenHolderScript();
  const applied = await getAppliedScripts();
  const deployed = await getDeployedScripts();

  const spendToProxyConfig: SpendToProxyConfig = {
    currenTime: emulator?.now() ?? Date.now(),
    scripts: {
      tokenHolderValidator: applied.scripts.tokenHolderValidator,
      proxyTokenHolderV1Validator: proxyTokenHolder.cborHex,
    },
    refScripts: {
      liquidityTokenHolderPolicy: deployed.scriptsRef.TokenHolderPolicy,
      liquidityTokenHolderValidator: deployed.scriptsRef.TokenHolderValidator,
    },
    v1PoolPolicyId: process.env.POOL_POLICY_ID!,
  };

  await selectLucidWallet(lucid, 0);
  const spendToProxyUnsigned = await spendToProxy(lucid, spendToProxyConfig);

  if (spendToProxyUnsigned.type == "error") {
    console.log(spendToProxyUnsigned.error);
    return;
  }

  const spendToProxySigned = await spendToProxyUnsigned.data.txComplete
    .sign()
    .complete();
  const spendToProxyHash = await spendToProxySigned.submit();
  console.log(`Submitting proxy transaction: ${spendToProxyHash}`);
  await lucid.awaitTx(spendToProxyHash);
  await loggerDD(`Done!`);

  return spendToProxyUnsigned.data.datum;
};
