import dotenv from "dotenv";
dotenv.config();
import { setTimeout } from "timers/promises";

import {
  Blockfrost,
  Lucid,
  Network,
  parseUTxOsAtScript,
  rewardFold,
  RewardFoldConfig,
  utxosAtScript,
} from "price-discovery-offchain";
import log4js from "log4js";
log4js.configure("log4js.json");
const logger = log4js.getLogger("app");

import applied from "../../../applied-scripts.json" assert { type: "json" };
import refScripts from "../../../deployed-policy.json" assert { type: "json" };
import { loggerDD } from "../../logs/datadog-service.js";
import { signSubmitValidate } from "../../utils/misc.js";
import { getLucidInstance, selectLucidWallet } from "../../utils/wallet.js";

const run = async () => {
  const lucid = await getLucidInstance();

  await loggerDD("running rewardFold");
  await loggerDD("selecting WALLET_PROJECT_0");
  await selectLucidWallet(0);

  const beneficiaryAddress = process.env.BENEFICIARY_ADDRESS!;

  const nodeUTxOs = await utxosAtScript(
    lucid,
    applied.scripts.discoveryValidator,
  );
  console.log("nodes at discoveryValidator: ", nodeUTxOs.length);
  console.log("time to process (seconds): ", nodeUTxOs.length * 40);

  let rewardUTxOs = await utxosAtScript(lucid, applied.scripts.rewardValidator);

  const maxRetries = 3;

  while (true) {
    await setTimeout(20_000);
    rewardUTxOs = await utxosAtScript(lucid, applied.scripts.rewardValidator);
    console.log(rewardUTxOs);
    if (rewardUTxOs.length == 0) break;

    let retries = 0;
    while (retries < maxRetries) {
      if (retries > 0) {
        rewardUTxOs = await utxosAtScript(
          lucid,
          applied.scripts.rewardValidator,
        );
        if (rewardUTxOs.length == 0) break;
        console.log(`retrying ${retries}`);
      }

      const rewardFoldConfig: RewardFoldConfig = {
        nodeInputs: nodeUTxOs,
        projectCS: process.env.PROJECT_CS!,
        projectTN: process.env.PROJECT_TN!,
        projectAddress: beneficiaryAddress,
        scripts: {
          nodeValidator: applied.scripts.discoveryValidator,
          discoveryStake: applied.scripts.discoveryStake,
          rewardFoldPolicy: applied.scripts.rewardPolicy,
          rewardFoldValidator: applied.scripts.rewardValidator,
        },
        refScripts: {
          nodeValidator: (
            await lucid.utxosByOutRef([
              refScripts.scriptsRef.DiscoveryValidator,
            ])
          )[0],
          discoveryStake: (
            await lucid.utxosByOutRef([
              refScripts.scriptsRef.DiscoveryStakeValidator,
            ])
          )[0],
          rewardFoldPolicy: (
            await lucid.utxosByOutRef([refScripts.scriptsRef.RewardFoldPolicy])
          )[0],
          rewardFoldValidator: (
            await lucid.utxosByOutRef([
              refScripts.scriptsRef.RewardFoldValidator,
            ])
          )[0],
        },
      };

      const rewardFoldUnsigned = await rewardFold(lucid, rewardFoldConfig);

      const isValid = await signSubmitValidate(lucid, rewardFoldUnsigned);
      if (isValid) break;
      retries++;
    }
  }
};

await run();
