import {
  InitLiquidityTokenHolderConfig,
  Lucid,
  initLqTokenHolder,
} from "price-discovery-offchain";

import { loggerDD } from "../../logs/datadog-service.js";
import { isDryRun } from "../../utils/args.js";
import {
  getAppliedScripts,
  getInitTokenHolderTx,
  getTTConfig,
  saveInitTokenHolderTx,
} from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const initTokenHolderAction = async (lucid: Lucid) => {
  const applied = await getAppliedScripts();
  const {
    project: { token },
    reservedUtxos,
  } = await getTTConfig();
  if (reservedUtxos?.initTokenHolder) {
    const utxos = await lucid.provider.getUtxosByOutRef(
      reservedUtxos.initTokenHolder,
    );

    lucid.selectWalletFrom({
      address: utxos[0].address,
      utxos,
    });
  } else {
    await selectLucidWallet(lucid, 1);
  }

  if (!isDryRun()) {
    const initTokenHolderTx = await getInitTokenHolderTx();
    if (!initTokenHolderTx) {
      throw new Error(
        `Could not find a token holder transaction to submit. Please run "yarn init-token-holder --dry".`,
      );
    }

    const initTokenHolderSigned = await lucid
      .fromTx(initTokenHolderTx)
      .sign()
      .complete();
    const initTokenHolderHash = await initTokenHolderSigned.submit();
    await loggerDD(`Submitting: ${initTokenHolderHash}`);
    await lucid.awaitTx(initTokenHolderHash);
    console.log("Done!");
    return;
  }

  const initTokenHolderConfig: InitLiquidityTokenHolderConfig = {
    projectCS: applied.rewardValidator.projectCS,
    projectTN: applied.rewardValidator.projectTN,
    projectAmount: token.suppliedAmount,
    scripts: {
      tokenHolderPolicy: applied.scripts.tokenHolderPolicy,
      tokenHolderValidator: applied.scripts.tokenHolderValidator,
    },
  };

  const initTokenHolderUnsigned = await initLqTokenHolder(
    lucid,
    initTokenHolderConfig,
  );

  if (initTokenHolderUnsigned.type === "error") {
    throw initTokenHolderUnsigned.error;
  }

  await saveInitTokenHolderTx(initTokenHolderUnsigned.data.toString());
};
