import { deployRefScripts } from "price-discovery-offchain";
import alwaysFailValidator from "../compiled/alwaysFails.json" assert { type: "json" };
import { PUBLISH_SCRIPT_WALLET_INDEX } from "../constants/network.js";
import "../utils/env.js";
import { getAppliedScripts, getTTConfig } from "../utils/files.js";
import { getLucidInstance, selectLucidWallet } from "../utils/wallet.js";

const publish = async () => {
  const lucid = await selectLucidWallet(
    await getLucidInstance(),
    PUBLISH_SCRIPT_WALLET_INDEX,
  );

  const applied = await getAppliedScripts();
  const {
    project: { addresses },
  } = await getTTConfig();
  const [spendingInput] = await lucid.provider.getUtxosByOutRef([
    {
      txHash:
        "4bbdd9631d1cd9106a01ce151f51723282d1ccbdf97e1c7e05741a388bbf31ec",
      outputIndex: 0,
    },
  ]);

  const deploy5 = await deployRefScripts(lucid, {
    script: applied.scripts.rewardFoldValidator,
    name: "RewardFoldValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    spendToAddress: addresses.publishScripts,
    currenTime: Date.now(),
    spendingInput: spendingInput,
  });

  if (deploy5.type === "error") {
    console.log(deploy5.error);
    return;
  }

  const txComplete = await deploy5.data.tx.complete();
  const signed = await txComplete.sign().complete();
  const txHash = await signed.submit();
  console.log(txHash);
};

publish();
