import { Emulator, Lucid } from "price-discovery-offchain";
import { PUBLISH_SCRIPT_WALLET_INDEX } from "../../constants/network.js";
import { isDryRun } from "../../utils/args.js";
import {
  getAppliedScripts,
  getRegisterStakeTx,
  saveRegisterStakeTx,
} from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

const submitRegisterStakeAction = async (lucid: Lucid) => {
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
};

export const registerStakeAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  await selectLucidWallet(lucid, PUBLISH_SCRIPT_WALLET_INDEX);

  if (!isDryRun() && !emulator) {
    await submitRegisterStakeAction(lucid);
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

  await saveRegisterStakeTx(registerStakeTx.toString(), Boolean(emulator));

  if (emulator) {
    await submitRegisterStakeAction(lucid);
  }
};
