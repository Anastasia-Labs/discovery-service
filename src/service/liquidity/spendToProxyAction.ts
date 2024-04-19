import {
  Emulator,
  Lucid,
  spendToProxy,
  SpendToProxyConfig,
} from "price-discovery-offchain";
import "../../utils/env.js";

import { SEED_WALLET_INDEX } from "../../constants/network.js";
import { loggerDD } from "../../logs/datadog-service.js";
import { isDryRun } from "../../utils/args.js";
import {
  getAppliedScripts,
  getPublishedPolicyOutRefs,
  getSpendToProxyTx,
  getTTConfig,
  saveSpendToProxyTx,
} from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

const submitSpendToProxyAction = async (lucid: Lucid) => {
  const spendToProxyTx = await getSpendToProxyTx();
  if (!spendToProxyTx) {
    throw new Error("A spendToProxy transaction could not be found to submit.");
  }

  const spendToProxySigned = await lucid
    .fromTx(spendToProxyTx)
    .sign()
    .complete();
  const spendToProxyHash = await spendToProxySigned.submit();
  console.log(`Submitting proxy transaction: ${spendToProxyHash}`);
  await lucid.awaitTx(spendToProxyHash);
  await loggerDD(`Done!`);
};

export const spendToProxyAction = async (lucid: Lucid, emulator?: Emulator) => {
  await selectLucidWallet(lucid, SEED_WALLET_INDEX);
  const applied = await getAppliedScripts();
  const deployed = await getPublishedPolicyOutRefs();
  const { v1PoolData } = await getTTConfig();

  if (!isDryRun() && !emulator) {
    await submitSpendToProxyAction(lucid);
    return;
  }

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
    v1PoolPolicyId: v1PoolData.policyId,
  };

  const spendToProxyUnsigned = await spendToProxy(lucid, spendToProxyConfig);

  if (spendToProxyUnsigned.type == "error") {
    throw spendToProxyUnsigned.error;
  }

  await saveSpendToProxyTx(
    spendToProxyUnsigned.data.txComplete.toString(),
    Boolean(emulator),
  );

  if (emulator) {
    await submitSpendToProxyAction(lucid);
  }
};
