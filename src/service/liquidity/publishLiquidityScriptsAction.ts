import "../../utils/env.js";

import {
  Emulator,
  Lucid,
  OutRef,
  deployRefScripts,
} from "price-discovery-offchain";

import { IPublishedPolicyJSON } from "../../@types/json.js";
import alwaysFailValidator from "../../compiled/alwaysFails.json" assert { type: "json" };
import { isDryRun } from "../../utils/args.js";
import {
  getAppliedScripts,
  getFragmentedUtxosMap,
  getPublishScriptTx,
  getTTConfig,
  savePublishScriptTx,
  savePublishedPolicyOutRefs,
} from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";
import { validatorsByIndex } from "./fragmentPublishWalletAction.js";

const submitPublishLiquidityScriptsAction = async (
  lucid: Lucid,
  emulator?: boolean,
) => {
  const applied = await getAppliedScripts();
  const signedTxs = await Promise.all(
    validatorsByIndex.map(async (name, index) => {
      const cbor = await getPublishScriptTx(index);
      if (!cbor) {
        throw new Error(
          `Could not find a built transaction for script for ${name} as index ${index}.`,
        );
      }

      return await lucid.fromTx(cbor).sign().complete();
    }),
  );

  const txHashes = await Promise.all(
    signedTxs.map(async (signedTx, index) => {
      const txHash = await signedTx.submit();
      console.log(`Submitting reference input #${index}...`);
      await lucid.awaitTx(txHash);
      console.log(`Deployed Reference Input: ${txHash}`);
      return txHash;
    }),
  );

  const scriptsRef: Record<string, OutRef> = {};

  validatorsByIndex.forEach((name, index) => {
    scriptsRef[name] = {
      txHash: txHashes[index],
      outputIndex: index,
    };
  });

  const data: IPublishedPolicyJSON = {
    policy: lucid.utils.mintingPolicyToId({
      type: "PlutusV2",
      script: applied.scripts.liquidityPolicy,
    }),
    scriptsRef: scriptsRef as unknown as IPublishedPolicyJSON["scriptsRef"],
  };

  await savePublishedPolicyOutRefs(data, emulator);

  console.log(`Waiting for confirmation that Blockfrost can find UTxOs...`);
  await Promise.all(txHashes.map(async (hash) => await lucid.awaitTx(hash)));
  console.log(`Done!`);
};

export const publishLiquidityScriptsAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  await selectLucidWallet(lucid, 2);
  const applied = await getAppliedScripts();

  if (!isDryRun() && !emulator) {
    await submitPublishLiquidityScriptsAction(lucid);
    return;
  }

  const {
    project: { addresses },
  } = await getTTConfig();

  const deployWalletAddress = await lucid.wallet.address();
  const {
    TasteTestPolicy,
    TasteTestValidator,
    CollectFoldPolicy,
    CollectFoldValidator,
    TokenHolderPolicy,
    TokenHolderValidator,
    RewardFoldPolicy,
    RewardFoldValidator,
    TasteTestStakeValidator,
    RewardStake,
  } = await getFragmentedUtxosMap();

  const spendingUtxos = await lucid.provider.getUtxosByOutRef([
    TasteTestPolicy,
    TasteTestValidator,
    CollectFoldPolicy,
    CollectFoldValidator,
    RewardFoldPolicy,
    RewardFoldValidator,
    TokenHolderPolicy,
    TokenHolderValidator,
    TasteTestStakeValidator,
    RewardStake,
  ]);

  const deployTime = Date.now();

  if (!spendingUtxos[0]) {
    throw new Error("Could not find input for index 0.");
  }
  const deploy0 = await deployRefScripts(lucid, {
    script: applied.scripts.liquidityPolicy,
    name: "TasteTestPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: addresses.publishScripts,
    currenTime: deployTime,
    spendingInput: spendingUtxos[0],
  });
  if (deploy0.type === "error") {
    throw new Error(
      `Error while trying to deploy script 0. Full error: ${deploy0.error.message}`,
    );
  }

  if (!spendingUtxos[1]) {
    throw new Error("Could not find input for index 1");
  }
  const deploy1 = await deployRefScripts(lucid, {
    script: applied.scripts.liquidityValidator,
    name: "TasteTestValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: addresses.publishScripts,
    currenTime: deployTime,
    spendingInput: spendingUtxos[1],
  });
  if (deploy1.type === "error") {
    throw new Error(
      `Error while trying to deploy script 1. Full error: ${deploy1.error.message}`,
    );
  }

  if (!spendingUtxos[2]) {
    throw new Error("Could not find input for index 2");
  }
  const deploy2 = await deployRefScripts(lucid, {
    script: applied.scripts.collectFoldPolicy,
    name: "CollectFoldPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: addresses.publishScripts,
    currenTime: deployTime,
    spendingInput: spendingUtxos[2],
  });
  if (deploy2.type === "error") {
    throw new Error(
      `Error while trying to deploy script 2. Full error: ${deploy2.error.message}`,
    );
  }

  if (!spendingUtxos[3]) {
    throw new Error("Could not find input for index 3");
  }
  const deploy3 = await deployRefScripts(lucid, {
    script: applied.scripts.collectFoldValidator,
    name: "CollectFoldValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: addresses.publishScripts,
    currenTime: deployTime,
    spendingInput: spendingUtxos[3],
  });
  if (deploy3.type === "error") {
    throw new Error(
      `Error while trying to deploy script 3. Full error: ${deploy3.error.message}`,
    );
  }

  if (!spendingUtxos[4]) {
    throw new Error("Could not find input for index 4");
  }
  const deploy4 = await deployRefScripts(lucid, {
    script: applied.scripts.rewardFoldPolicy,
    name: "RewardFoldPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: addresses.publishScripts,
    currenTime: deployTime,
    spendingInput: spendingUtxos[4],
  });
  if (deploy4.type === "error") {
    throw new Error(
      `Error while trying to deploy script 4. Full error: ${deploy4.error.message}`,
    );
  }

  if (!spendingUtxos[5]) {
    throw new Error("Could not find input for index 5");
  }
  const deploy5 = await deployRefScripts(lucid, {
    script: applied.scripts.rewardFoldValidator,
    name: "RewardFoldValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: addresses.publishScripts,
    currenTime: deployTime,
    spendingInput: spendingUtxos[5],
  });
  if (deploy5.type === "error") {
    throw new Error(
      `Error while trying to deploy script 5. Full error: ${deploy5.error.message}`,
    );
  }

  if (!spendingUtxos[6]) {
    throw new Error("Could not find input for index 6");
  }
  const deploy6 = await deployRefScripts(lucid, {
    script: applied.scripts.tokenHolderPolicy,
    name: "TokenHolderPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: addresses.publishScripts,
    currenTime: deployTime,
    spendingInput: spendingUtxos[6],
  });
  if (deploy6.type === "error") {
    throw new Error(
      `Error while trying to deploy script 6. Full error: ${deploy6.error.message}`,
    );
  }

  if (!spendingUtxos[7]) {
    throw new Error("Could not find input for index 7");
  }
  const deploy7 = await deployRefScripts(lucid, {
    script: applied.scripts.tokenHolderValidator,
    name: "TokenHolderValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: addresses.publishScripts,
    currenTime: deployTime,
    spendingInput: spendingUtxos[7],
  });
  if (deploy7.type === "error") {
    throw new Error(
      `Error while trying to deploy script 7. Full error: ${deploy7.error.message}`,
    );
  }

  if (!spendingUtxos[8]) {
    throw new Error("Could not find input for index 8");
  }
  const deploy8 = await deployRefScripts(lucid, {
    script: applied.scripts.collectStake,
    name: "TasteTestStakeValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: addresses.publishScripts,
    currenTime: deployTime,
    spendingInput: spendingUtxos[8],
  });
  if (deploy8.type === "error") {
    throw new Error(
      `Error while trying to deploy script 8. Full error: ${deploy8.error.message}`,
    );
  }

  if (!spendingUtxos[9]) {
    throw new Error("Could not find input for index 9");
  }
  const deploy9 = await deployRefScripts(lucid, {
    script: applied.scripts.rewardStake,
    name: "RewardStake",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: addresses.publishScripts,
    currenTime: deployTime,
    spendingInput: spendingUtxos[9],
  });
  if (deploy9.type === "error") {
    throw new Error(
      `Error while trying to deploy script 9. Full error: ${deploy9.error.message}`,
    );
  }

  await Promise.all(
    [
      deploy0.data.tx,
      deploy1.data.tx,
      deploy2.data.tx,
      deploy3.data.tx,
      deploy4.data.tx,
      deploy5.data.tx,
      deploy6.data.tx,
      deploy7.data.tx,
      deploy8.data.tx,
      deploy9.data.tx,
    ].map(async (tx, index) => {
      try {
        const txComplete = await tx.complete({
          coinSelection: false,
          change: {
            address: deployWalletAddress,
          },
        });

        await savePublishScriptTx(
          txComplete.toString(),
          index,
          Boolean(emulator),
        );
      } catch (e) {
        throw new Error(
          `Error when building deploy transaction at index ${index}: ${e}`,
        );
      }
    }),
  );

  if (emulator) {
    await submitPublishLiquidityScriptsAction(lucid, true);
  }
};
