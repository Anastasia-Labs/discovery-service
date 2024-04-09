import { Lucid } from "price-discovery-offchain";
import { isDryRun } from "../../utils/args.js";
import {
  getAppliedScripts,
  getRegisterStakeTx,
  saveRegisterStakeTx,
} from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const registerStakeAction = async (lucid: Lucid) => {
  await selectLucidWallet(lucid, 2);

  if (!isDryRun()) {
    const tx = await getRegisterStakeTx();
    if (!tx) {
      throw new Error(
        `Could not find a registerStake transaction to submit. Run "yarn register-stake --dry" to generate one.`,
      );
    }

    const signed = await lucid.fromTx(tx).sign().complete();
    const txHash = await signed.submit();
    console.log(`Submitting: ${txHash}`);
    await lucid.awaitTx(txHash);
    console.log(`Done!`);
    return;
  }

  const applied = await getAppliedScripts();

  const liquidityStakeRewardAddress = lucid.utils.validatorToRewardAddress({
    type: "PlutusV2",
    script: applied.scripts.collectStake,
  });

  const rewardStakeRewardAddress = lucid.utils.validatorToRewardAddress({
    type: "PlutusV2",
    script: applied.scripts.rewardStake,
  });

  const registerStakeTx = await lucid
    .newTx()
    .registerStake(liquidityStakeRewardAddress!)
    .registerStake(rewardStakeRewardAddress!)
    .complete();

  await saveRegisterStakeTx(registerStakeTx.toString());
};
