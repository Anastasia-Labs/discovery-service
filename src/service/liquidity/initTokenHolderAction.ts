import inquirer from "inquirer";
import {
  InitTokenHolderConfig,
  Lucid,
  UTxO,
  fromText,
  initLqTokenHolder,
  toUnit,
} from "price-discovery-offchain";

import { writeFile } from "fs/promises";
import { loggerDD } from "../../logs/datadog-service.js";
import { getAppliedScripts } from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const initTokenHolderAction = async (lucid: Lucid) => {
  const applied = await getAppliedScripts();
  const externalTokenProvider = Boolean(
    process.env.SHOULD_BUILD_TOKEN_DEPOSIT_TX!,
  );

  const tokenHolderUtxo = await lucid.utxosByOutRef([
    applied.projectTokenHolder.initOutRef,
  ]);
  const initUtxo = tokenHolderUtxo.find(
    ({ outputIndex }) =>
      outputIndex === applied.projectTokenHolder.initOutRef.outputIndex,
  ) as UTxO;

  if (!initUtxo) {
    throw new Error(
      "Aborting. Could not find an initUTXO to initialize the token holder with!",
    );
  }

  let collectFrom: UTxO[] | undefined;
  if (externalTokenProvider) {
    const [address] = await inquirer.prompt([
      {
        message: "What is the user's wallet address?",
      },
    ]);

    if (!address) {
      throw new Error("Can not initialize token holder with empty values.");
    }

    collectFrom = await lucid.provider.getUtxosWithUnit(
      address,
      toUnit(process.env.PROJECT_CS!, fromText(process.env.PROJECT_TN!)),
    );
  }

  // Collect from our own wallet.
  await selectLucidWallet(lucid, 1);
  const initTokenHolderConfig: InitTokenHolderConfig = {
    collectFrom,
    initUTXO: initUtxo,
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

  if (process.env.DRY_RUN!) {
    console.log(initTokenHolderUnsigned.data.toString());
  } else {
    if (externalTokenProvider) {
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
  }
};
