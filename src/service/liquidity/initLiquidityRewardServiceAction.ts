import dotenv from "dotenv";
dotenv.config();
import {
  Emulator,
  initLqRewardFold,
  InitRewardFoldConfig,
  Lucid,
} from "price-discovery-offchain";

import { selectLucidWallet } from "../../utils/wallet.js";
import { getAppliedScripts, getDeployedScripts } from "../../utils/files.js";

export const initLiquidityRewardServiceAction = async (
  lucid: Lucid,
  emulator?: Emulator,
  policyId?: string,
  assetName?: string,
) => {
  const applied = await getAppliedScripts();
  const deployed = await getDeployedScripts();

  const initRewardFoldConfig: InitRewardFoldConfig = {
    currenTime: emulator?.now() ?? Date.now(),
    projectCS: policyId ?? process.env.PROJECT_CS!,
    projectTN: Buffer.from(assetName ?? process.env.PROJECT_TN!).toString(
      "hex",
    ),
    scripts: {
      nodeValidator: applied.scripts.liquidityValidator,
      nodePolicy: applied.scripts.liquidityPolicy,
      foldPolicy: applied.scripts.collectFoldPolicy,
      foldValidator: applied.scripts.collectFoldValidator,
      rewardFoldPolicy: applied.scripts.rewardFoldPolicy,
      rewardFoldValidator: applied.scripts.rewardFoldValidator,
      tokenHolderPolicy: applied.scripts.tokenHolderPolicy,
      tokenHolderValidator: applied.scripts.tokenHolderValidator,
    },
    refScripts: {
      nodePolicy: (
        await lucid.utxosByOutRef([deployed.scriptsRef.TasteTestPolicy])
      )[0],
      nodeValidator: (
        await lucid.utxosByOutRef([deployed.scriptsRef.TasteTestValidator])
      )[0],
      commitFoldPolicy: (
        await lucid.utxosByOutRef([deployed.scriptsRef.CollectFoldPolicy])
      )[0],
      commitFoldValidator: (
        await lucid.utxosByOutRef([deployed.scriptsRef.CollectFoldValidator])
      )[0],
      rewardFoldPolicy: (
        await lucid.utxosByOutRef([deployed.scriptsRef.RewardFoldPolicy])
      )[0],
      rewardFoldValidator: (
        await lucid.utxosByOutRef([deployed.scriptsRef.RewardFoldValidator])
      )[0],
      tokenHolderPolicy: (
        await lucid.utxosByOutRef([deployed.scriptsRef.TokenHolderPolicy])
      )[0],
      tokenHolderValidator: (
        await lucid.utxosByOutRef([deployed.scriptsRef.TokenHolderValidator])
      )[0],
    },
  };

  await selectLucidWallet(lucid, 0);
  const initRewardFoldUnsigned = await initLqRewardFold(
    lucid,
    initRewardFoldConfig,
  );

  if (initRewardFoldUnsigned.type == "error") {
    console.log(initRewardFoldUnsigned.error);
    return;
  }

  const initRewardFoldSigned = await initRewardFoldUnsigned.data
    .sign()
    .complete();
  console.log(
    Buffer.from(initRewardFoldSigned.txSigned.body().to_bytes()).toString(
      "hex",
    ),
  );
  //   const initRewardFoldHash = await initRewardFoldSigned.submit();
  //   await lucid.awaitTx(initRewardFoldHash);
  //   await loggerDD(`initRewardFold submitted TxHash: ${ initRewardFoldHash }`)
};
