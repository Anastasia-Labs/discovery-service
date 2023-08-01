import dotenv from "dotenv";
dotenv.config();
import {
  Blockfrost,
  Lucid,
  Network,
  rewardFold,
  RewardFoldConfig,
  utxosAtScript,
} from "price-discovery-offchain";

import applied from "../applied-scripts-1690385346726.json" assert { type: "json" };
import refScripts from "../deploy-policy-1690385346726.json" assert { type: "json" };

const run = async () => {
  const lucid = await Lucid.new(
    new Blockfrost(process.env.API_URL!, process.env.API_KEY),
    process.env.NETWORK as Network
  );

  const beneficiaryAddress = await lucid
    .selectWalletFromSeed(process.env.WALLET_BENEFICIARY_1!)
    .wallet.address();

  const nodeUTxOs = await utxosAtScript(
    lucid,
    applied.scripts.discoveryValidator
  );

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

  lucid.selectWalletFromSeed(process.env.WALLET_BENEFICIARY_1!);
  const rewardFoldUnsigned = await rewardFold(lucid, rewardFoldConfig);

  if (rewardFoldUnsigned.type == "error") {
    console.log(rewardFoldUnsigned.error);
    return;
  }

  // console.log(initNodeUnsigned.data.txComplete.to_json());
  const rewardFoldSigned = await rewardFoldUnsigned.data.sign().complete();
  const rewardFoldHash = await rewardFoldSigned.submit();
  await lucid.awaitTx(rewardFoldHash);
  console.log("submitted TxHash: ", rewardFoldHash);
};

await run();
