import {
  Emulator,
  Lucid,
  spendToProxy,
  SpendToProxyConfig,
} from "price-discovery-offchain";
import "../../utils/env.js";

import { loggerDD } from "../../logs/datadog-service.js";
import { getAppliedScripts, getDeployedScripts } from "../../utils/files.js";
import { isDryRun } from "../../utils/misc.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const spendToProxyAction = async (lucid: Lucid, emulator?: Emulator) => {
  const applied = await getAppliedScripts();
  const deployed = await getDeployedScripts();

  const spendToProxyConfig: SpendToProxyConfig = {
    currenTime: emulator?.now() ?? Date.now(),
    scripts: {
      tokenHolderValidator: applied.scripts.tokenHolderValidator,
      proxyTokenHolderValidator: applied.scripts.proxyTokenHolderValidator,
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
    throw spendToProxyUnsigned.error;
  }

  if (isDryRun()) {
    console.log(spendToProxyUnsigned.data.txComplete.toString());
  } else {
    const spendToProxySigned = await spendToProxyUnsigned.data.txComplete
      .sign()
      .complete();
    const spendToProxyHash = await spendToProxySigned.submit();
    console.log(`Submitting proxy transaction: ${spendToProxyHash}`);
    await lucid.awaitTx(spendToProxyHash);
    await loggerDD(`Done!`);

    return spendToProxyUnsigned.data.datum;
  }
};
