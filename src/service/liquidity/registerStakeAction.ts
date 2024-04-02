import { Lucid } from "price-discovery-offchain";
import { loggerDD } from "../../logs/datadog-service.js";
import { isDryRun } from "../../utils/args.js";
import { getAppliedScripts } from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const registerStakeAction = async (lucid: Lucid) => {
  await selectLucidWallet(lucid, 2);
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

  if (isDryRun()) {
    console.log(registerStakeTx.toString());
  } else {
    const registerStakeSignedTx = await registerStakeTx.sign().complete();
    const registerStakeHash = await registerStakeSignedTx.submit();

    await loggerDD(`Submitting Registration: ${registerStakeHash}`);
    await lucid.awaitTx(registerStakeHash);
  }
};
