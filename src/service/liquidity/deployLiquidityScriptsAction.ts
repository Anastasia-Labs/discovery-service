import dotenv from "dotenv";
import { writeFileSync } from "fs";
import {
  Emulator,
  Lucid,
  OutRef,
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

  const spendingUtxos = await lucid.provider.getUtxos(deployWalletAddress);
  const deploy1 = await deployRefScripts(lucid, {
    script: applied.scripts.liquidityPolicy,
    name: "TasteTestPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[0],
  });
  if (deploy1.type == "error") {
    console.log(deploy1.error);
    return;
  }

  // try {
  //   const deploy1Hash = await (await ((await deploy1.data.tx.complete()).sign().complete())).submit();
  //   await lucid.awaitTx(deploy1Hash);
  //   await setTimeout(20_000)
  // } catch (e) {
  //   console.log("Could not deploy 1")
  // }

  const deploy2 = await deployRefScripts(lucid, {
    script: applied.scripts.liquidityValidator,
    name: "TasteTestValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[1],
  });
  if (deploy2.type == "error") {
    console.log(deploy2.error);
    return;
  }

  // try {
  //   const deploy2Hash = await (await ((await deploy2.data.tx.complete()).sign().complete())).submit();
  //   await lucid.awaitTx(deploy2Hash);
  //   await setTimeout(20_000)
  // } catch (e) {
  //   console.log("Could not deploy 2")
  // }

  const deploy3 = await deployRefScripts(lucid, {
    script: applied.scripts.collectFoldPolicy,
    name: "CollectFoldPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[2],
  });
  if (deploy3.type == "error") {
    console.log(deploy3.error);
    return;
  }

  // try {
  //   const deploy3Hash = await (await ((await deploy3.data.tx.complete()).sign().complete())).submit();
  //   await lucid.awaitTx(deploy3Hash);
  //   await setTimeout(20_000)
  // } catch (e) {
  //   console.log("Could not deploy 3")
  // }

  const deploy4 = await deployRefScripts(lucid, {
    script: applied.scripts.collectFoldValidator,
    name: "CollectFoldValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[3],
  });
  if (deploy4.type == "error") {
    console.log(deploy4.error);
    return;
  }

  // try {
  //   const deploy4Hash = await (await ((await deploy4.data.tx.complete()).sign().complete())).submit();
  //   await lucid.awaitTx(deploy4Hash);
  //   await setTimeout(20_000)
  // } catch (e) {
  //   console.log("Could not deploy 4")
  // }

  const deploy5 = await deployRefScripts(lucid, {
    script: applied.scripts.rewardFoldPolicy,
    name: "RewardFoldPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[4],
  });
  if (deploy5.type == "error") {
    console.log(deploy5.error);
    return;
  }

  // try {
  //   const deploy5Hash = await (await ((await deploy5.data.tx.complete()).sign().complete())).submit();
  //   await lucid.awaitTx(deploy5Hash);
  //   await setTimeout(20_000)
  // } catch (e) {
  //   console.log("Could not deploy 5")
  // }

  const deploy6 = await deployRefScripts(lucid, {
    script: applied.scripts.rewardFoldValidator,
    name: "RewardFoldValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[5],
  });
  if (deploy6.type == "error") {
    console.log(deploy6.error);
    return;
  }

  // try {
  //   const deploy6Hash = await (await ((await deploy6.data.tx.complete()).sign().complete())).submit();
  //   await lucid.awaitTx(deploy6Hash);
  //   await setTimeout(20_000)
  // } catch (e) {
  //   console.log("Could not deploy 6")
  // }

  const deploy7 = await deployRefScripts(lucid, {
    script: applied.scripts.tokenHolderPolicy,
    name: "TokenHolderPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[6],
  });
  if (deploy7.type == "error") {
    console.log(deploy7.error);
    return;
  }

  // try {
  //   const deploy7Hash = await (await ((await deploy7.data.tx.complete()).sign().complete())).submit();
  //   await lucid.awaitTx(deploy7Hash);
  //   await setTimeout(20_000)
  // } catch (e) {
  //   console.log("Could not deploy 7")
  // }

  const deploy8 = await deployRefScripts(lucid, {
    script: applied.scripts.tokenHolderValidator,
    name: "TokenHolderValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[7],
  });
  if (deploy8.type == "error") {
    console.log(deploy8.error);
    return;
  }

  // try {
  //   const deploy8Hash = await (await ((await deploy8.data.tx.complete()).sign().complete())).submit();
  //   await lucid.awaitTx(deploy8Hash);
  //   await setTimeout(20_000)
  // } catch (e) {
  //   console.log("Could not deploy 8")
  // }

  const deploy9 = await deployRefScripts(lucid, {
    script: applied.scripts.collectStake,
    name: "TasteTestStakeValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[8],
  });
  if (deploy9.type == "error") {
    console.log(deploy9.error);
    return;
  }

  const deploy10 = await deployRefScripts(lucid, {
    script: applied.scripts.rewardStake,
    name: "RewardStake",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
    spendingInput: spendingUtxos[9],
  });
  if (deploy10.type == "error") {
    console.log(deploy10.error);
    return;
  }

  // try {
  //   const deploy9Hash = await (await ((await deploy9.data.tx.complete()).sign().complete())).submit();
  //   await lucid.awaitTx(deploy9Hash);
  //   await setTimeout(20_000)
  // } catch (e) {
  //   console.log("Could not deploy 9")
  // }

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
      console.log(`Completed deploy group ${index}`);
      return await txComplete.sign().complete();
    }),
  );

  const txHashes = await Promise.all(
    signedTxs.map(async (signedTx) => {
      const txHash = await signedTx.submit();
      console.log(`Submitting: ${txHash}`);
      await lucid.awaitTx(txHash);
      return txHash;
    }),
  );

  txHashes.forEach((hash) => console.log(`Deployed Ref Script: ${hash}`));

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

  console.log(data);

  writeFileSync(`./deployed-policy.json`, data);

  console.log(
    `Deployed scripts have been saved with policy: ${deploy9.data.deployPolicyId}`,
  );
};
