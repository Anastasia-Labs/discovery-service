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

import applied from "../../applied-scripts.json" assert { type: "json" };
import refScripts from "../../deployed-policy.json" assert { type: "json" };
import { loggerDD } from "../logs/datadog-service.js";

const run = async () => {
  const lucid = await Lucid.new(
    new Blockfrost(process.env.API_URL!, process.env.API_KEY),
    process.env.NETWORK as Network
  );

  const beneficiaryAddress = process.env.BENEFICIARY_ADDRESS!;

  const nodeUTxOs = await utxosAtScript(
    lucid,
    applied.scripts.discoveryValidator
  );
  await loggerDD("running rewardFold");
  console.log("nodes at discoveryValidator: ", nodeUTxOs.length);
  console.log("time to process (seconds): ", nodeUTxOs.length * 40);

  let rewardUTxOs = await utxosAtScript(lucid, applied.scripts.rewardValidator);

  while (rewardUTxOs.length == 1) {
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
          await lucid.utxosByOutRef([refScripts.scriptsRef.DiscoveryValidator])
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
          await lucid.utxosByOutRef([refScripts.scriptsRef.RewardFoldValidator])
        )[0],
      },
    };

    lucid.selectWalletFromSeed(process.env.WALLET_PROJECT_0!);
    const rewardFoldUnsigned = await rewardFold(lucid, rewardFoldConfig);

    if (rewardFoldUnsigned.type == "error") {
      console.log(rewardFoldUnsigned.error);
      return;
    }

    // console.log(initNodeUnsigned.data.txComplete.to_json());
    const rewardFoldSigned = await rewardFoldUnsigned.data.sign().complete();
    const rewardFoldHash = await rewardFoldSigned.submit();
    await lucid.awaitTx(rewardFoldHash);
    await loggerDD(`rewardFold submitted TxHash: ${rewardFoldHash}`);

    await setTimeout(20_000);
    rewardUTxOs = await utxosAtScript(lucid, applied.scripts.rewardValidator);
  }
};

await run();
