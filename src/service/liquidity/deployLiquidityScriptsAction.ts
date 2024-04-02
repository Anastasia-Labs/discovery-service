import "../../utils/env.js";

import {
  Emulator,
  Lucid,
  OutRef,
  UTxO,
  deployRefScripts,
  fromText,
  toUnit,
} from "price-discovery-offchain";
import { setTimeout } from "timers/promises";

import { writeFile } from "fs/promises";
import alwaysFailValidator from "../../compiled/alwaysFails.json" assert { type: "json" };
import { MIN_ADA_DEPLOY_WALLET } from "../../constants/utils.js";
import { loggerDD } from "../../logs/datadog-service.js";
import { isDryRun } from "../../utils/args.js";
import { getAppliedScripts, getDeployUtxoMap } from "../../utils/files.js";
import { lovelaceAtAddress } from "../../utils/misc.js";
import { selectLucidWallet } from "../../utils/wallet.js";

const refScriptAmountsByIndex = [
  32_000_000n,
  25_000_000n,
  14_000_000n,
  24_000_000n,
  20_000_000n,
  30_000_000n,
  8_000_000n,
  18_000_000n,
  4_000_000n,
  4_000_000n,
];

const validatorsByIndex = [
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

export const deployLiquidityScriptsAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  const applied = await getAppliedScripts();

  await selectLucidWallet(lucid, 2);
  const deployWalletAddress = await lucid.wallet.address();
  const deployWalletFunds = await lovelaceAtAddress(lucid);
  if (deployWalletFunds < MIN_ADA_DEPLOY_WALLET) {
    console.log(
      `Not enough funds ${deployWalletFunds}, ${deployWalletAddress}`,
    );
    await loggerDD(`Not enough funds ${deployWalletFunds}`);
    return;
  }

  //NOTE: deploy minting policy has 15 minutes deadline it should be enough time to deploy 9 scripts
  const deployTime = Date.now();
  const splitTx = lucid.newTx();
  const deployWalletUtxos = await lucid.wallet.getUtxos();
  if (deployWalletUtxos.length < 2) {
    [...new Array(10).keys()].forEach((index) => {
      splitTx.payToAddress(deployWalletAddress, {
        lovelace: refScriptAmountsByIndex[index],
      });
    });

    const txComplete = await splitTx.complete();

    if (isDryRun()) {
      console.log(txComplete.toString());
      return;
    } else {
      const hash = await (await txComplete.sign().complete()).submit();
      lucid.awaitTx(hash);
      console.log("Submitting fragmentation: " + hash);

      if (!emulator) {
        await setTimeout(20_000);
      }

      const scriptsRef: Record<string, OutRef> = {};
      for (const name of validatorsByIndex) {
        scriptsRef[name] = {
          txHash: hash,
          outputIndex: validatorsByIndex.indexOf(name),
        };
      }

      await writeFile(
        `./deploy-utxo-map.json`,
        JSON.stringify(scriptsRef),
        "utf-8",
      );
    }
  }

  let spendingUtxos: UTxO[] =
    await lucid.provider.getUtxos(deployWalletAddress);

  if (!emulator) {
    while (spendingUtxos.length < 10) {
      spendingUtxos = await lucid.provider.getUtxos(deployWalletAddress);
      await setTimeout(3_000);
    }
  }

  const deployUtxos = await getDeployUtxoMap();

  const deploy1Input = (
    await lucid.provider.getUtxosByOutRef([deployUtxos.TasteTestPolicy])
  )?.[0];

  if (!deploy1Input) {
    throw new Error("Could not find input for index 1");
  }
  const deploy1 = await deployRefScripts(lucid, {
    script: applied.scripts.liquidityPolicy,
    name: "TasteTestPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: process.env.REF_SCRIPTS_ADDRESS!,
    currenTime: deployTime,
    spendingInput: deploy1Input,
  });
  if (deploy1.type === "error") {
    throw new Error(
      `Error while trying to deploy script 1. Full error: ${deploy1.error.message}`,
    );
  }

  const deploy2Input = (
    await lucid.provider.getUtxosByOutRef([deployUtxos.TasteTestValidator])
  )?.[0];

  if (!deploy2Input) {
    throw new Error("Could not find input for index 1");
  }
  const deploy2 = await deployRefScripts(lucid, {
    script: applied.scripts.liquidityValidator,
    name: "TasteTestValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: process.env.REF_SCRIPTS_ADDRESS!,
    currenTime: deployTime,
    spendingInput: deploy2Input,
  });
  if (deploy2.type === "error") {
    throw new Error(
      `Error while trying to deploy script 2. Full error: ${deploy2.error.message}`,
    );
  }

  const deploy3Input = (
    await lucid.provider.getUtxosByOutRef([deployUtxos.CollectFoldPolicy])
  )?.[0];

  if (!deploy3Input) {
    throw new Error("Could not find input for index 3");
  }
  const deploy3 = await deployRefScripts(lucid, {
    script: applied.scripts.collectFoldPolicy,
    name: "CollectFoldPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: process.env.REF_SCRIPTS_ADDRESS!,
    currenTime: deployTime,
    spendingInput: deploy3Input,
  });
  if (deploy3.type === "error") {
    throw new Error(
      `Error while trying to deploy script 3. Full error: ${deploy3.error.message}`,
    );
  }

  const deploy4Input = (
    await lucid.provider.getUtxosByOutRef([deployUtxos.CollectFoldValidator])
  )?.[0];

  if (!deploy4Input) {
    throw new Error("Could not find input for index 4");
  }
  const deploy4 = await deployRefScripts(lucid, {
    script: applied.scripts.collectFoldValidator,
    name: "CollectFoldValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: process.env.REF_SCRIPTS_ADDRESS!,
    currenTime: deployTime,
    spendingInput: deploy4Input,
  });
  if (deploy4.type === "error") {
    throw new Error(
      `Error while trying to deploy script 4. Full error: ${deploy4.error.message}`,
    );
  }

  const deploy5Input = (
    await lucid.provider.getUtxosByOutRef([deployUtxos.RewardFoldPolicy])
  )?.[0];

  if (!deploy5Input) {
    throw new Error("Could not find input for index 5");
  }
  const deploy5 = await deployRefScripts(lucid, {
    script: applied.scripts.rewardFoldPolicy,
    name: "RewardFoldPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: process.env.REF_SCRIPTS_ADDRESS!,
    currenTime: deployTime,
    spendingInput: deploy5Input,
  });
  if (deploy5.type === "error") {
    throw new Error(
      `Error while trying to deploy script 5. Full error: ${deploy5.error.message}`,
    );
  }

  const deploy6Input = (
    await lucid.provider.getUtxosByOutRef([deployUtxos.RewardFoldValidator])
  )?.[0];

  if (!deploy6Input) {
    throw new Error("Could not find input for index 6");
  }
  const deploy6 = await deployRefScripts(lucid, {
    script: applied.scripts.rewardFoldValidator,
    name: "RewardFoldValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: process.env.REF_SCRIPTS_ADDRESS!,
    currenTime: deployTime,
    spendingInput: deploy6Input,
  });
  if (deploy6.type === "error") {
    throw new Error(
      `Error while trying to deploy script 6. Full error: ${deploy6.error.message}`,
    );
  }

  const deploy7Input = (
    await lucid.provider.getUtxosByOutRef([deployUtxos.TokenHolderPolicy])
  )?.[0];

  if (!deploy7Input) {
    throw new Error("Could not find input for index 7");
  }
  const deploy7 = await deployRefScripts(lucid, {
    script: applied.scripts.tokenHolderPolicy,
    name: "TokenHolderPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: process.env.REF_SCRIPTS_ADDRESS!,
    currenTime: deployTime,
    spendingInput: deploy7Input,
  });
  if (deploy7.type === "error") {
    throw new Error(
      `Error while trying to deploy script 7. Full error: ${deploy7.error.message}`,
    );
  }

  const deploy8Input = (
    await lucid.provider.getUtxosByOutRef([deployUtxos.TokenHolderValidator])
  )?.[0];

  if (!deploy8Input) {
    throw new Error("Could not find input for index 8");
  }
  const deploy8 = await deployRefScripts(lucid, {
    script: applied.scripts.tokenHolderValidator,
    name: "TokenHolderValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: process.env.REF_SCRIPTS_ADDRESS!,
    currenTime: deployTime,
    spendingInput: deploy8Input,
  });
  if (deploy8.type === "error") {
    throw new Error(
      `Error while trying to deploy script 8. Full error: ${deploy8.error.message}`,
    );
  }

  const deploy9Input = (
    await lucid.provider.getUtxosByOutRef([deployUtxos.TasteTestStakeValidator])
  )?.[0];

  if (!deploy9Input) {
    throw new Error("Could not find input for index 9");
  }
  const deploy9 = await deployRefScripts(lucid, {
    script: applied.scripts.collectStake,
    name: "TasteTestStakeValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: process.env.REF_SCRIPTS_ADDRESS!,
    currenTime: deployTime,
    spendingInput: deploy9Input,
  });
  if (deploy9.type === "error") {
    throw new Error(
      `Error while trying to deploy script 9. Full error: ${deploy9.error.message}`,
    );
  }

  const deploy10Input = (
    await lucid.provider.getUtxosByOutRef([deployUtxos.RewardStake])
  )?.[0];

  if (!deploy10Input) {
    throw new Error("Could not find input for index 10");
  }
  const deploy10 = await deployRefScripts(lucid, {
    script: applied.scripts.rewardStake,
    name: "RewardStake",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: process.env.REF_SCRIPTS_ADDRESS!,
    currenTime: deployTime,
    spendingInput: deploy10Input,
  });
  if (deploy10.type === "error") {
    throw new Error(
      `Error while trying to deploy script 10. Full error: ${deploy10.error.message}`,
    );
  }

  const signedTxs = await Promise.all(
    [
      deploy1.data.tx,
      deploy2.data.tx,
      deploy3.data.tx,
      deploy4.data.tx,
      deploy5.data.tx,
      deploy6.data.tx,
      deploy7.data.tx,
      deploy8.data.tx,
      deploy9.data.tx,
      deploy10.data.tx,
    ].map(async (tx, index) => {
      try {
        const txComplete = await tx.complete({
          coinSelection: false,
          change: {
            address: deployWalletAddress,
          },
        });

        if (isDryRun()) {
          console.log(
            JSON.stringify({
              [`deploy_${index}`]: txComplete.toString(),
            }),
          );
        }

        const completed = await txComplete.sign().complete();
        console.log(`Completed building reference input #${index}`);
        return completed;
      } catch (e) {
        console.log(e);
        throw new Error(
          `Error when building deploy transaction at index: ${index}`,
        );
      }
    }),
  );

  if (isDryRun()) {
    return;
  }

  await Promise.all(
    signedTxs.map(async (signedTx, index) => {
      const txHash = await signedTx.submit();
      console.log(`Submitting reference input #${index}...`);
      await lucid.awaitTx(txHash);
      console.log(`Deployed Reference Input: ${txHash}`);
      return txHash;
    }),
  );

  const deployPolicyId = deploy1.data.deployPolicyId;

  const scriptsRef: Record<string, OutRef> = {};

  for (const name of validatorsByIndex) {
    const [validatorUTxO] = await lucid.utxosAtWithUnit(
      process.env.REF_SCRIPTS_ADDRESS! ??
        lucid.utils.validatorToAddress({
          type: "PlutusV2",
          script: alwaysFailValidator.cborHex,
        }),
      toUnit(deployPolicyId, fromText(name)),
    );
    scriptsRef[name] = {
      txHash: validatorUTxO.txHash,
      outputIndex: validatorUTxO.outputIndex,
    };
  }

  const data = JSON.stringify(
    {
      policy: deploy9.data.deployPolicyId,
      scriptsRef,
    },
    undefined,
    2,
  );

  await writeFile(`./deployed-policy.json`, data, "utf-8");

  console.log(
    `Deployed scripts have been saved with policy: ${deploy9.data.deployPolicyId}`,
  );
};
