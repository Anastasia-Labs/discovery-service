import dotenv from "dotenv";
dotenv.config();
import { writeFile } from "node:fs";
import {
  Blockfrost,
  buildScripts,
  deployRefScripts,
  Lucid,
  Network,
  TWENTY_FOUR_HOURS_MS,
} from "price-discovery-offchain";

import scripts from "../applied-scripts-1690323740945.json" assert { type: "json" };
import alwaysFailValidator from "./compiled/alwaysFails.json" assert { type: "json" };

const run = async () => {
  //NOTE: DEPLOY
  const lucid = await Lucid.new(
    new Blockfrost(process.env.API_URL!, process.env.API_KEY),
    process.env.NETWORK as Network
  );
  lucid.selectWalletFromSeed(process.env.WALLET_PROJECT_2!);

  const deployTime = Date.now();

  const deploy1 = await deployRefScripts(lucid, {
    script: scripts.discoveryPolicy,
    name: `DiscoveryPol-${scripts.version}`,
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy1.type == "error") {
    console.log(deploy1.error);
    return;
  }
  const deploy1Hash = await (await deploy1.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy1Hash);
  console.log("submitted TxHash: ", deploy1Hash);

  const deploy2 = await deployRefScripts(lucid, {
    script: scripts.discoveryValidator,
    name: `DiscoveryVal-${scripts.version}`,
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy2.type == "error") {
    console.log(deploy2.error);
    return;
  }
  const deploy2Hash = await (await deploy2.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy2Hash);
  console.log("submitted TxHash: ", deploy2Hash);

  const deploy3 = await deployRefScripts(lucid, {
    script: scripts.foldPolicy,
    name: `FoldPol-${scripts.version}`,
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy3.type == "error") {
    console.log(deploy3.error);
    return;
  }
  const deploy3Hash = await (await deploy3.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy3Hash);
  console.log("submitted TxHash: ", deploy3Hash);

  const deploy4 = await deployRefScripts(lucid, {
    script: scripts.foldValidator,
    name: `FoldVal-${scripts.version}`,
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy4.type == "error") {
    console.log(deploy4.error);
    return;
  }
  const deploy4Hash = await (await deploy4.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy4Hash);
  console.log("submitted TxHash: ", deploy4Hash);

  const deploy5 = await deployRefScripts(lucid, {
    script: scripts.rewardPolicy,
    name: `RewardFoldPol-${scripts.version}`,
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy5.type == "error") {
    console.log(deploy5.error);
    return;
  }
  const deploy5Hash = await (await deploy5.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy5Hash);
  console.log("submitted TxHash: ", deploy5Hash);

  const deploy6 = await deployRefScripts(lucid, {
    script: scripts.rewardValidator,
    name: `RewardFoldVal-${scripts.version}`,
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy6.type == "error") {
    console.log(deploy6.error);
    return;
  }
  const deploy6Hash = await (await deploy6.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy6Hash);
  console.log("submitted TxHash: ", deploy6Hash);

  const deploy7 = await deployRefScripts(lucid, {
    script: scripts.tokenHolderPolicy,
    name: `TokenHolderPol-${scripts.version}`,
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy7.type == "error") {
    console.log(deploy7.error);
    return;
  }
  const deploy7Hash = await (await deploy7.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy7Hash);
  console.log("submitted TxHash: ", deploy7Hash);

  const deploy8 = await deployRefScripts(lucid, {
    script: scripts.tokenHolderValidator,
    name: `TokenHolderVal-${scripts.version}`,
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy8.type == "error") {
    console.log(deploy8.error);
    return;
  }
  const deploy8Hash = await (await deploy8.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy8Hash);
  console.log("submitted TxHash: ", deploy8Hash);

  const deploy9 = await deployRefScripts(lucid, {
    script: scripts.discoveryStake,
    name: `DiscoveryStak-${scripts.version}`,
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy9.type == "error") {
    console.log(deploy9.error);
    return;
  }
  const deploy9Hash = await (await deploy9.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy9Hash);
  console.log("submitted TxHash: ", deploy9Hash);

  writeFile(
    `./deploy-policy-${scripts.version}.json`,
    JSON.stringify({ policy: deploy9.data.deployPolicyId }),
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
