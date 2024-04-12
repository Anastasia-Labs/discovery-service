import inquirer from "inquirer";
import { Emulator, Lucid, OutRef } from "price-discovery-offchain";

import { IFragmentedUtxosMapJSON } from "../../@types/json.js";
import { PUBLISH_SCRIPT_WALLET_INDEX } from "../../constants/network.js";
import { getPublishWalletAda } from "../../constants/utils.js";
import { loggerDD } from "../../logs/datadog-service.js";
import { isDryRun } from "../../utils/args.js";
import {
  getFragmentWalletTx,
  getTTConfig,
  saveFragmentWalletTx,
  saveFragmentedUtxosMapPath,
} from "../../utils/files.js";
import { lovelaceAtAddress } from "../../utils/misc.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const getRefScriptAmountsByIndex = async () => {
  const { scriptType } = await getTTConfig();
  switch (scriptType) {
    case "binds": {
      return [
        200_000_000n,
        100_000_000n,
        48_000_000n,
        96_000_000n,
        120_000_000n,
        140_000_000n,
        32_000_000n,
        100_000_000n,
        16_000_000n,
        16_000_000n,
      ];
    }
    case "tracing": {
      return [
        62_000_000n,
        50_000_000n,
        28_000_000n,
        48_000_000n,
        60_000_000n,
        70_000_000n,
        16_000_000n,
        32_000_000n,
        8_000_000n,
        8_000_000n,
      ];
    }
    default:
    case "optimized": {
      return [
        32_000_000n,
        25_000_000n,
        14_000_000n,
        24_000_000n,
        30_000_000n,
        35_000_000n,
        8_000_000n,
        18_000_000n,
        4_000_000n,
        4_000_000n,
      ];
    }
  }
};

export const validatorsByIndex = [
  "TasteTestPolicy",
  "TasteTestValidator",
  "CollectFoldPolicy",
  "CollectFoldValidator",
  "RewardFoldPolicy",
  "RewardFoldValidator",
  "TokenHolderPolicy",
  "TokenHolderValidator",
  "TasteTestStakeValidator",
  "RewardStake",
];

const submitFragmentPublishWallet = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  const fragmentWalletTx = await getFragmentWalletTx();
  if (!fragmentWalletTx) {
    throw new Error(`Could not find a fragmentWalletTx to submit.`);
  }

  const signed = await lucid.fromTx(fragmentWalletTx).sign().complete();
  const txHash = await signed.submit();
  console.log(`Submitting: ${txHash}`);
  await lucid.awaitTx(txHash);
  console.log("Done!");

  const scriptsRef: Record<string, OutRef> = {};
  for (const name of validatorsByIndex) {
    scriptsRef[name] = {
      txHash,
      outputIndex: validatorsByIndex.indexOf(name),
    };
  }

  console.log(`Saving resulting outputs...`);
  await saveFragmentedUtxosMapPath(
    scriptsRef as unknown as IFragmentedUtxosMapJSON,
    Boolean(emulator),
  );
};

export const fragmentPublishWalletAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  await selectLucidWallet(lucid, PUBLISH_SCRIPT_WALLET_INDEX);
  const fragmentWalletTx = await getFragmentWalletTx();

  if (!isDryRun() && !emulator) {
    await submitFragmentPublishWallet(lucid);
    return;
  }

  const deployWalletAddress = await lucid.wallet.address();
  const deployWalletFunds = await lovelaceAtAddress(lucid);
  if (deployWalletFunds < (await getPublishWalletAda())) {
    console.log(
      `Not enough funds ${deployWalletFunds}, ${deployWalletAddress}`,
    );
    await loggerDD(`Not enough funds ${deployWalletFunds}`);
    return;
  }

  const splitTx = lucid.newTx();
  if (!emulator && fragmentWalletTx) {
    const { continueFragmentation } = await inquirer.prompt([
      {
        name: "This wallet has already built a fragmentation transaction that can be submitted. Overwrite?",
        type: "confirm",
        value: "continueFragmentation",
        default: false,
      },
    ]);

    if (!continueFragmentation) {
      console.log("Aborted.");
      return;
    }
  }

  const refScriptAmountsByIndex = await getRefScriptAmountsByIndex();

  [...new Array(10).keys()].forEach((index) => {
    splitTx.payToAddress(deployWalletAddress, {
      lovelace: refScriptAmountsByIndex[index],
    });
  });

  const txComplete = await splitTx.complete();
  await saveFragmentWalletTx(txComplete.toString(), Boolean(emulator));

  if (emulator) {
    await submitFragmentPublishWallet(lucid, emulator);
  }
};
