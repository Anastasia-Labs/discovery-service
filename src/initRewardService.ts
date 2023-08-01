import dotenv from "dotenv";
dotenv.config();
import {
  Blockfrost,
  initFold,
  InitFoldConfig,
  initNode,
  InitNodeConfig,
  initRewardFold,
  InitRewardFoldConfig,
  initTokenHolder,
  InitTokenHolderConfig,
  Lucid,
  multiFold,
  MultiFoldConfig,
  Network,
  parseUTxOsAtScript,
  sortByOutRefWithIndex,
} from "price-discovery-offchain";

import applied from "../applied-scripts-1690385346726.json" assert { type: "json" };
import refScripts from "../deploy-policy-1690385346726.json" assert { type: "json" };

const run = async () => {
  const lucid = await Lucid.new(
    new Blockfrost(process.env.API_URL!, process.env.API_KEY),
    process.env.NETWORK as Network
  );

  const initRewardFoldConfig: InitRewardFoldConfig = {
    projectCS: process.env.PROJECT_CS!,
    projectTN: process.env.PROJECT_TN!,
    scripts: {
      nodeValidator: applied.scripts.discoveryValidator,
      nodePolicy: applied.scripts.discoveryPolicy,
      foldPolicy: applied.scripts.foldPolicy,
      foldValidator: applied.scripts.foldValidator,
      rewardFoldPolicy: applied.scripts.rewardPolicy,
      rewardFoldValidator: applied.scripts.rewardValidator,
      tokenHolderPolicy: applied.scripts.tokenHolderPolicy,
      tokenHolderValidator: applied.scripts.tokenHolderValidator,
    },
    refScripts: {
      nodePolicy: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.DiscoveryPolicy])
      )[0],
      nodeValidator: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.DiscoveryValidator])
      )[0],
      commitFoldPolicy: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.FoldPolicy])
      )[0],
      commitFoldValidator: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.FoldValidator])
      )[0],
      rewardFoldPolicy: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.RewardFoldPolicy])
      )[0],
      rewardFoldValidator: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.RewardFoldValidator])
      )[0],
      tokenHolderPolicy: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.TokenHolderPolicy])
      )[0],
      tokenHolderValidator: (
        await lucid.utxosByOutRef([refScripts.scriptsRef.TokenHolderValidator])
      )[0],
    },
  };

  lucid.selectWalletFromSeed(process.env.WALLET_BENEFICIARY_1!);
  const initRewardFoldUnsigned = await initRewardFold(
    lucid,
    initRewardFoldConfig
  );

  if (initRewardFoldUnsigned.type == "error") {
    console.log(initRewardFoldUnsigned.error);
    return;
  }

  const initRewardFoldSigned = await initRewardFoldUnsigned.data
    .sign()
    .complete();
  const initRewardFoldHash = await initRewardFoldSigned.submit();
  await lucid.awaitTx(initRewardFoldHash);
  console.log("submitted TxHash: ", initRewardFoldHash);
};

await run();
