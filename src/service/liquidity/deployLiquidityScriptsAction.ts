import { setTimeout } from "timers/promises";
import dotenv from "dotenv";
dotenv.config();
import { writeFile } from "fs/promises";
import {
  deployRefScripts
} from "price-discovery-offchain";
import {
  fromText,
  Lucid,
  OutRef,
  toUnit
} from "lucid-fork";

import alwaysFailValidator from "../../compiled/alwaysFails.json" assert { type: "json" };
import { loggerDD } from "../../logs/datadog-service.js";
import { lovelaceAtAddress } from "../../utils/misc.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const deployLiquidityScriptsAction = async (lucid: Lucid) => {
  const { default: applied } = await import("../../../applied-scripts.json", { assert: { type: "json" } })
  await loggerDD("running deployScripts");

  await selectLucidWallet(lucid, 2);
  const deployWalletAddress = await lucid.wallet.address();
  const deployWalletFunds = await lovelaceAtAddress(lucid);
  if (deployWalletFunds < 500_000_000n) {
    console.log(`Not enough funds ${deployWalletFunds}, ${deployWalletAddress}`);
    await loggerDD(`Not enough funds ${deployWalletFunds}`);
    return
  }

  //NOTE: deploy minting policy has 15 minutes deadline it should be enough time to deploy 9 scripts
  const deployTime = Date.now();
  const splitTx = lucid.newTx();
  [...new Array(10).keys()].forEach(() => {
    splitTx.payToAddress(
      deployWalletAddress,
      {
        lovelace: (500_000_000n / 10n) - 1_000_000n
      }
    )
  });
  const hash = await (await (await splitTx.complete()).sign().complete()).submit()
  lucid.awaitTx(hash)
  const spendingUtxos = await lucid.wallet.getUtxos();

  const deploy1 = await deployRefScripts(lucid, {
    script: applied.scripts.liquidityPolicy,
    name: "TasteTestPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[0]
  });
  if (deploy1.type == "error") {
    console.log(deploy1.error);
    return;
  }

  const deploy2 = await deployRefScripts(lucid, {
    script: applied.scripts.liquidityValidator,
    name: "TasteTestValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[1]
  });
  if (deploy2.type == "error") {
    console.log(deploy2.error);
    return;
  }

  const deploy3 = await deployRefScripts(lucid, {
    script: applied.scripts.collectFoldPolicy,
    name: "CollectFoldPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[3]
  });
  if (deploy3.type == "error") {
    console.log(deploy3.error);
    return;
  }

  const deploy4 = await deployRefScripts(lucid, {
    script: applied.scripts.collectFoldValidator,
    name: "CollectFoldValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[4]
  });
  if (deploy4.type == "error") {
    console.log(deploy4.error);
    return;
  }

  const deploy5 = await deployRefScripts(lucid, {
    script: applied.scripts.rewardFoldPolicy,
    name: "RewardFoldPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[5]
  });
  if (deploy5.type == "error") {
    console.log(deploy5.error);
    return;
  }

  const deploy6 = await deployRefScripts(lucid, {
    script: applied.scripts.rewardFoldValidator,
    name: "RewardFoldValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[6]
  });
  if (deploy6.type == "error") {
    console.log(deploy6.error);
    return;
  }

  const deploy7 = await deployRefScripts(lucid, {
    script: applied.scripts.tokenHolderPolicy,
    name: "TokenHolderPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[7]
  });
  if (deploy7.type == "error") {
    console.log(deploy7.error);
    return;
  }

  const deploy8 = await deployRefScripts(lucid, {
    script: applied.scripts.tokenHolderValidator,
    name: "TokenHolderValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[8]
  });
  if (deploy8.type == "error") {
    console.log(deploy8.error);
    return;
  }

  const deploy9 = await deployRefScripts(lucid, {
    script: applied.scripts.collectStake,
    name: "TasteTestStakeValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[9]
  });
  if (deploy9.type == "error") {
    console.log(deploy9.error);
    return;
  }

  const signedTxs = await Promise.all([
    [
      deploy1.data.tx,
      deploy2.data.tx,
    ],
    [
      deploy3.data.tx,
      deploy4.data.tx,
    ],
    [
      deploy5.data.tx,
      deploy6.data.tx,
      deploy7.data.tx,
    ],
    [
      deploy8.data.tx,
      deploy9.data.tx
    ]
  ].map(async txGroup => {
    const tx = lucid.newTx();
    txGroup.forEach(deployTx => tx.compose(deployTx))
    const txComplete = await tx.complete();
    return await txComplete.sign().complete();
  }))

  const txHashes = await Promise.all(signedTxs.map(async (signedTx) => {
    const txHash = await signedTx.submit();
    await lucid.awaitTx(txHash);
    return txHash;
  }))

  txHashes.forEach(hash => console.log(`Deployed Ref Script: ${hash}`))

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
  ];

  const scriptsRef: Record<string, OutRef> = {};

  for (const name of validators) {
    const [validatorUTxO] = await lucid.utxosAtWithUnit(
      lucid.utils.validatorToAddress({
        type: "PlutusV2",
        script: alwaysFailValidator.cborHex,
      }),
      toUnit(deployPolicyId, fromText(name))
    );
    scriptsRef[name] = {
      txHash: validatorUTxO.txHash,
      outputIndex: validatorUTxO.outputIndex,
    };
  }

  await writeFile(
    `./deployed-policy.json`,
    JSON.stringify(
      {
        policy: deploy9.data.deployPolicyId,
        scriptsRef: scriptsRef,
      },
      undefined,
      2
    )
  );

  console.log(
    `Deployed scripts have been saved with policy: ${deploy9.data.deployPolicyId}`
  );
};
