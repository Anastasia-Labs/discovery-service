import { writeFile } from "fs/promises";
import {
  InitLiquidityTokenHolderConfig,
  Lucid,
  initLqTokenHolder,
} from "price-discovery-offchain";

import { loggerDD } from "../../logs/datadog-service.js";
import { getAppliedScripts } from "../../utils/files.js";
import { isDryRun } from "../../utils/misc.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const initTokenHolderAction = async (lucid: Lucid) => {
  const applied = await getAppliedScripts();
  const externalTokenProvider =
    process.env.SHOULD_BUILD_TOKEN_DEPOSIT_TX! !== "false";

  // Collect from the token holder's wallet.
  const tokenSupplierAddress = process.env.PROJECT_TOKEN_HOLDER_ADDRESS!;
  if (tokenSupplierAddress && externalTokenProvider) {
    const utxos = await lucid.provider.getUtxosByOutRef([
      {
        txHash: process.env.TT_INIT_TOKEN_HOLDER_UTXO_HASH!,
        outputIndex: Number(process.env.TT_INIT_TOKEN_HOLDER_UTXO_INDEX!),
      },
      {
        txHash:
          "4dcaeeb8f0084fb9b6c3409cf685493d25b4010951932dfe5ceeba477cca4d1c",
        outputIndex: 0,
      },
    ]);

    lucid.selectWalletFrom({
      address: utxos[0].address,
      utxos,
    });
  } else {
    await selectLucidWallet(lucid, 1);
  }
  const initTokenHolderConfig: InitLiquidityTokenHolderConfig = {
    projectCS: applied.rewardValidator.projectCS,
    projectTN: applied.rewardValidator.projectTN,
    projectAmount: Number(process.env.PROJECT_AMNT),
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

  if (externalTokenProvider || isDryRun()) {
    await writeFile(
      `./token-holder-submit.json`,
      JSON.stringify({
        cbor: initTokenHolderUnsigned.data.toString(),
      }),
    );
    await loggerDD(
      `Created TokenHolder transaction in token-holder-submit.json.`,
    );
  } else {
    const initTokenHolderSigned = await initTokenHolderUnsigned.data
      .sign()
      .complete();
    const initTokenHolderHash = await initTokenHolderSigned.submit();
    await loggerDD(`Submitting TokenHolder: ${initTokenHolderHash}`);
    await lucid.awaitTx(initTokenHolderHash);
  }
};
