import dotenv from "dotenv";
import { writeFileSync } from "fs";
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
dotenv.config();

import alwaysFailValidator from "../../compiled/alwaysFails.json" assert { type: "json" };
import {
  DEPLOY_WALLET_ADA,
  MIN_ADA_DEPLOY_WALLET,
} from "../../constants/utils.js";
import { loggerDD } from "../../logs/datadog-service.js";
import { getAppliedScripts } from "../../utils/files.js";
import { lovelaceAtAddress } from "../../utils/misc.js";
import { selectLucidWallet } from "../../utils/wallet.js";

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
  if ((await lucid.wallet.getUtxos()).length < 2) {
    [...new Array(10).keys()].forEach(() => {
      splitTx.payToAddress(deployWalletAddress, {
        lovelace: DEPLOY_WALLET_ADA / 10n - 1_000_000n,
      });
    });
    const hash = await (
      await (await splitTx.complete()).sign().complete()
    ).submit();
    lucid.awaitTx(hash);
    if (!emulator) {
      console.log("Submitting fragmentation: " + hash);
      await setTimeout(20_000);
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

  const deploy1 = await deployRefScripts(lucid, {
    script: applied.scripts.liquidityPolicy,
    name: "TasteTestPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[0],
  });
  if (deploy1.type === "error") {
    throw deploy1.error;
  }

  const deploy2 = await deployRefScripts(lucid, {
    script: applied.scripts.liquidityValidator,
    name: "TasteTestValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[1],
  });
  if (deploy2.type === "error") {
    throw deploy2.error;
  }

  const deploy3 = await deployRefScripts(lucid, {
    script: applied.scripts.collectFoldPolicy,
    name: "CollectFoldPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[2],
  });
  if (deploy3.type === "error") {
    throw deploy3.error;
  }

  const deploy4 = await deployRefScripts(lucid, {
    script: applied.scripts.collectFoldValidator,
    name: "CollectFoldValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[3],
  });
  if (deploy4.type === "error") {
    throw deploy4.error;
  }

  const deploy5 = await deployRefScripts(lucid, {
    script: applied.scripts.rewardFoldPolicy,
    name: "RewardFoldPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[4],
  });
  if (deploy5.type === "error") {
    throw deploy5.error;
  }

  const deploy6 = await deployRefScripts(lucid, {
    script: applied.scripts.rewardFoldValidator,
    name: "RewardFoldValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[5],
  });
  if (deploy6.type === "error") {
    throw deploy6.error;
  }

  const deploy7 = await deployRefScripts(lucid, {
    script: applied.scripts.tokenHolderPolicy,
    name: "TokenHolderPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[6],
  });
  if (deploy7.type === "error") {
    throw deploy7.error;
  }

  const deploy8 = await deployRefScripts(lucid, {
    script: applied.scripts.tokenHolderValidator,
    name: "TokenHolderValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[7],
  });
  if (deploy8.type === "error") {
    throw deploy8.error;
  }

  const deploy9 = await deployRefScripts(lucid, {
    script: applied.scripts.collectStake,
    name: "TasteTestStakeValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[8],
  });
  if (deploy9.type === "error") {
    throw deploy9.error;
  }

  const deploy10 = await deployRefScripts(lucid, {
    script: applied.scripts.rewardStake,
    name: "RewardStake",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[9],
  });
  if (deploy10.type === "error") {
    throw deploy10.error;
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
      const txComplete = await tx.complete({
        coinSelection: false,
        change: {
          address: deployWalletAddress,
        },
      });
      const completed = await txComplete.sign().complete();
      console.log(`Completed building reference input #${index}`);
      return completed;
    }),
  );

  const txHashes = await Promise.all(
    signedTxs.map(async (signedTx, index) => {
      const txHash = await signedTx.submit();
      console.log(`Submitting reference input #${index}...`);
      await lucid.awaitTx(txHash);
      return txHash;
    }),
  );

  txHashes.forEach((hash) => console.log(`Deployed Reference Input: ${hash}`));

  //NOTE: FIND UTXOS
  const deployPolicyId = deploy1.data.deployPolicyId;

  const validators = [
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

  const scriptsRef: Record<string, OutRef> = {};

  for (const name of validators) {
    const [validatorUTxO] = await lucid.utxosAtWithUnit(
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
      scriptsRef: scriptsRef,
    },
    undefined,
    2,
  );

  writeFileSync(`./deployed-policy.json`, data);

  console.log(
    `Deployed scripts have been saved with policy: ${deploy9.data.deployPolicyId}`,
  );
};
