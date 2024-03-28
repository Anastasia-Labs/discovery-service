import { writeFile } from "fs/promises";
import {
  InitLiquidityTokenHolderConfig,
  Lucid,
  initLqTokenHolder,
} from "price-discovery-offchain";

import { loggerDD } from "../../logs/datadog-service.js";
import { getAppliedScripts, getDeployedScripts } from "../../utils/files.js";
import { isDryRun } from "../../utils/misc.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const initTokenHolderAction = async (lucid: Lucid) => {
  const applied = await getAppliedScripts();
  const deployed = await getDeployedScripts();
  const externalTokenProvider =
    process.env.SHOULD_BUILD_TOKEN_DEPOSIT_TX! !== "false";

  // Collect from the token holder's wallet.
  const tokenSupplierAddress = process.env.PROJECT_TOKEN_HOLDER_ADDRESS!;
  if (tokenSupplierAddress && externalTokenProvider) {
    lucid.selectWalletFrom({
      address: tokenSupplierAddress,
      utxos: (await lucid.provider.getUtxos(tokenSupplierAddress)).filter(
        // Don't spend out deployed scripts if they have been put in the same wallet.
        ({ assets }) => {
          let validUtxo = true;
          for (const assetId in assets) {
            if (assetId.includes(deployed.policy)) {
              validUtxo = false;
              break;
            }
          }

          return validUtxo;
        },
      ),
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
