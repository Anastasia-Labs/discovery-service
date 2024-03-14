import { setTimeout } from "timers/promises";
import dotenv from "dotenv";
dotenv.config();
import { writeFile } from "node:fs";
import {
  Blockfrost,
  deployRefScripts,
  fromText,
  Lucid,
  Network,
  OutRef,
  toUnit,
} from "price-discovery-offchain";
import log4js from "log4js";
log4js.configure("log4js.json");
const logger = log4js.getLogger("app");

import applied from "../../applied-scripts.json" assert { type: "json" };
import alwaysFailValidator from "../compiled/alwaysFails.json" assert { type: "json" };
import { loggerDD } from "../logs/datadog-service.js";
import { lovelaceAtAddress } from "../utils/misc.js";
import { getLucidInstance, selectLucidWallet } from "../utils/wallet.js";

const run = async () => {
  //WARNING: Make sure WALLET_PROJECT_2 has enough ADA ideally more than 500 ADA, deployment is expensive
  await loggerDD("running deployScripts");

  //NOTE: DEPLOY
  const lucid = await getLucidInstance();
  await loggerDD("selecting WALLET_PROJECT_2");
  await selectLucidWallet(2);
  const walletProject2Funds = await lovelaceAtAddress(lucid);
  if (walletProject2Funds < 200_000_000n) {
    console.log(`Not enough funds ${walletProject2Funds}, ${await lucid.wallet.address()}`);
    await loggerDD(`Not enough funds ${walletProject2Funds}`);
    return
  }

  //NOTE: deploy minting policy has 15 minutes deadline it should be enough time to deploy 9 scripts
  const deployTime = Date.now();

  const deploy1 = await deployRefScripts(lucid, {
    script: applied.scripts.liquidityPolicy,
    name: "TasteTestPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy1.type == "error") {
    console.log(deploy1.error);
    return;
  }
  const deploy1Hash = await (await deploy1.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy1Hash);
  await loggerDD(`TasteTestPolicy submitted TxHash:  ${deploy1Hash}`);
  // offset wallet & blockchain sync
  await setTimeout(20_000);

  const deploy2 = await deployRefScripts(lucid, {
    script: applied.scripts.liquidityValidator,
    name: "TasteTestValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy2.type == "error") {
    console.log(deploy2.error);
    return;
  }
  const deploy2Hash = await (await deploy2.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy2Hash);
  await loggerDD(`TasteTestValidator submitted TxHash:  ${deploy2Hash}`);
  // offset wallet & blockchain sync
  await setTimeout(20_000);

  const deploy3 = await deployRefScripts(lucid, {
    script: applied.scripts.collectFoldPolicy,
    name: "CollectFoldPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy3.type == "error") {
    console.log(deploy3.error);
    return;
  }
  const deploy3Hash = await (await deploy3.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy3Hash);
  await loggerDD(`CollectFoldPolicy submitted TxHash: ${deploy3Hash}`);
  // offset wallet & blockchain sync
  await setTimeout(20_000);

  const deploy4 = await deployRefScripts(lucid, {
    script: applied.scripts.collectFoldValidator,
    name: "CollectFoldValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy4.type == "error") {
    console.log(deploy4.error);
    return;
  }
  const deploy4Hash = await (await deploy4.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy4Hash);
  await loggerDD(`CollectFoldValidator submitted TxHash:  ${deploy4Hash}`);
  // offset wallet & blockchain sync
  await setTimeout(20_000);

  const deploy5 = await deployRefScripts(lucid, {
    script: applied.scripts.rewardFoldPolicy,
    name: "RewardFoldPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy5.type == "error") {
    console.log(deploy5.error);
    return;
  }
  const deploy5Hash = await (await deploy5.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy5Hash);
  await loggerDD(`RewardFoldPolicy submitted TxHash:  ${deploy5Hash}`);
  // offset wallet & blockchain sync
  await setTimeout(20_000);

  const deploy6 = await deployRefScripts(lucid, {
    script: applied.scripts.rewardFoldValidator,
    name: "RewardFoldValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy6.type == "error") {
    console.log(deploy6.error);
    return;
  }
  const deploy6Hash = await (await deploy6.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy6Hash);
  await loggerDD(`RewardFoldValidator submitted TxHash: ${deploy6Hash}`);
  // offset wallet & blockchain sync
  await setTimeout(20_000);

  const deploy7 = await deployRefScripts(lucid, {
    script: applied.scripts.tokenHolderPolicy,
    name: "TokenHolderPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy7.type == "error") {
    console.log(deploy7.error);
    return;
  }
  const deploy7Hash = await (await deploy7.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy7Hash);
  await loggerDD(`TokenHolderPolicy submitted TxHash: ${deploy7Hash}`);
  // offset wallet & blockchain sync
  await setTimeout(20_000);

  const deploy8 = await deployRefScripts(lucid, {
    script: applied.scripts.tokenHolderValidator,
    name: "TokenHolderValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy8.type == "error") {
    console.log(deploy8.error);
    return;
  }
  const deploy8Hash = await (await deploy8.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy8Hash);
  await loggerDD(`TokenHolderValidator submitted TxHash: ${deploy8Hash}`);
  // offset wallet & blockchain sync
  await setTimeout(20_000);

  const deploy9 = await deployRefScripts(lucid, {
    script: applied.scripts.collectStake,
    name: "TasteTestStakeValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy9.type == "error") {
    console.log(deploy9.error);
    return;
  }
  const deploy9Hash = await (await deploy9.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy9Hash);
  await loggerDD(`TasteTestStakeValidator submitted TxHash: ${deploy9Hash}`);
  // offset wallet & blockchain sync
  await setTimeout(20_000);

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

  writeFile(
    `./deployed-policy.json`,
    JSON.stringify(
      {
        policy: deploy9.data.deployPolicyId,
        scriptsRef: scriptsRef,
      },
      undefined,
      2
    ),
    (error) => {
      error
        ? console.log(error)
        : console.log(
            `Deploy policy has been saved \n
            policy: ${deploy9.data.deployPolicyId}`
          );
    }
  );
};
await run();
