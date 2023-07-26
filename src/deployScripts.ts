import dotenv from "dotenv";
dotenv.config();
import { writeFile } from "node:fs";
import {
  Blockfrost,
  deployRefScripts,
  fromText,
  Lucid,
  Network,
  OutRef,
  toUnit,
} from "price-discovery-offchain";

import applied from "../applied-scripts-1690385346726.json" assert { type: "json" };
import alwaysFailValidator from "./compiled/alwaysFails.json" assert { type: "json" };

const run = async () => {
  const timeOut = 10_000
  //NOTE: DEPLOY
  const lucid = await Lucid.new(
    new Blockfrost(process.env.API_URL!, process.env.API_KEY),
    process.env.NETWORK as Network
  );
  lucid.selectWalletFromSeed(process.env.WALLET_PROJECT_2!);
  console.log("WALLET_PROJECT_2 Address ", await lucid.wallet.address())

  const deployTime = Date.now();

  const deploy1 = await deployRefScripts(lucid, {
    script: applied.scripts.discoveryPolicy,
    name: "DiscoveryPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy1.type == "error") {
    console.log(deploy1.error);
    return;
  }
  const deploy1Hash = await (await deploy1.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy1Hash);
  setTimeout(() => console.log("submitted TxHash: ", deploy1Hash), timeOut); // offset wallet & blockchain sync

  const deploy2 = await deployRefScripts(lucid, {
    script: applied.scripts.discoveryValidator,
    name: "DiscoveryValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy2.type == "error") {
    console.log(deploy2.error);
    return;
  }
  const deploy2Hash = await (await deploy2.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy2Hash);
  setTimeout(() => console.log("submitted TxHash: ", deploy2Hash), timeOut); // offset wallet & blockchain sync

  const deploy3 = await deployRefScripts(lucid, {
    script: applied.scripts.foldPolicy,
    name: "FoldPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy3.type == "error") {
    console.log(deploy3.error);
    return;
  }
  const deploy3Hash = await (await deploy3.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy3Hash);
  setTimeout(() => console.log("submitted TxHash: ", deploy3Hash), timeOut); // offset wallet & blockchain sync

  const deploy4 = await deployRefScripts(lucid, {
    script: applied.scripts.foldValidator,
    name: "FoldValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy4.type == "error") {
    console.log(deploy4.error);
    return;
  }
  const deploy4Hash = await (await deploy4.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy4Hash);
  setTimeout(() => console.log("submitted TxHash: ", deploy4Hash), timeOut); // offset wallet & blockchain sync

  const deploy5 = await deployRefScripts(lucid, {
    script: applied.scripts.rewardPolicy,
    name: "RewardFoldPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy5.type == "error") {
    console.log(deploy5.error);
    return;
  }
  const deploy5Hash = await (await deploy5.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy5Hash);
  setTimeout(() => console.log("submitted TxHash: ", deploy5Hash), timeOut); // offset wallet & blockchain sync

  const deploy6 = await deployRefScripts(lucid, {
    script: applied.scripts.rewardValidator,
    name: "RewardFoldValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy6.type == "error") {
    console.log(deploy6.error);
    return;
  }
  const deploy6Hash = await (await deploy6.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy6Hash);
  setTimeout(() => console.log("submitted TxHash: ", deploy6Hash), timeOut); // offset wallet & blockchain sync

  const deploy7 = await deployRefScripts(lucid, {
    script: applied.scripts.tokenHolderPolicy,
    name: "TokenHolderPolicy",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy7.type == "error") {
    console.log(deploy7.error);
    return;
  }
  const deploy7Hash = await (await deploy7.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy7Hash);
  setTimeout(() => console.log("submitted TxHash: ", deploy7Hash), timeOut); // offset wallet & blockchain sync

  const deploy8 = await deployRefScripts(lucid, {
    script: applied.scripts.tokenHolderValidator,
    name: "TokenHolderValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy8.type == "error") {
    console.log(deploy8.error);
    return;
  }
  const deploy8Hash = await (await deploy8.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy8Hash);
  setTimeout(() => console.log("submitted TxHash: ", deploy8Hash), timeOut); // offset wallet & blockchain sync

  const deploy9 = await deployRefScripts(lucid, {
    script: applied.scripts.discoveryStake,
    name: "DiscoveryStakeValidator",
    alwaysFails: alwaysFailValidator.cborHex,
    currenTime: deployTime,
  });
  if (deploy9.type == "error") {
    console.log(deploy9.error);
    return;
  }
  const deploy9Hash = await (await deploy9.data.tx.sign().complete()).submit();
  await lucid.awaitTx(deploy9Hash);
  setTimeout(() => console.log("submitted TxHash: ", deploy9Hash), timeOut); // offset wallet & blockchain sync

  //NOTE: FIND UTXOS
  const deployPolicyId = deploy1.data.deployPolicyId;

  const validators = [
    "DiscoveryPolicy",
    "DiscoveryValidator",
    "FoldPolicy",
    "FoldValidator",
    "RewardFoldPolicy",
    "RewardFoldValidator",
    "TokenHolderPolicy",
    "TokenHolderValidator",
    "DiscoveryStakeValidator",
  ];

  const scriptsRef: Record<string, OutRef> = {};

  for (const name of validators) {
    const [validatorUTxO] = await lucid.utxosAtWithUnit(
      lucid.utils.validatorToAddress({
        type: "PlutusV2",
        script: alwaysFailValidator.cborHex,
      }),
      toUnit(deployPolicyId, fromText(name))
    );
    scriptsRef[name] = {
      txHash: validatorUTxO.txHash,
      outputIndex: validatorUTxO.outputIndex,
    };
  }

  // const scriptsRef = Validators.reduce(async (result, name) => {
  //   const [validatorUTxO] = await lucid.utxosAtWithUnit(
  //     lucid.utils.validatorToAddress({
  //       type: "PlutusV2",
  //       script: alwaysFailValidator.cborHex,
  //     }),
  //     toUnit(deployPolicyId, fromText(name))
  //   );
  //   return {
  //     ...result,
  //     ...{
  //       [name]: {
  //         txHash: validatorUTxO.txHash,
  //         outputIndex: validatorUTxO.outputIndex,
  //       },
  //     },
  //   };
  // }, {});

  // const [nodeValidatorUTxO] = await lucid.utxosAtWithUnit(
  //   lucid.utils.validatorToAddress({
  //     type: "PlutusV2",
  //     script: alwaysFailValidator.cborHex,
  //   }),
  //   toUnit(deployPolicyId, fromText("DiscoveryValidator"))
  // );
  //
  // const [nodePolicyUTxO] = await lucid.utxosAtWithUnit(
  //   lucid.utils.validatorToAddress({
  //     type: "PlutusV2",
  //     script: alwaysFailValidator.cborHex,
  //   }),
  //   toUnit(deployPolicyId, fromText("DiscoveryPolicy"))
  // );
  //
  // const [foldPolicyUTxO] = await lucid.utxosAtWithUnit(
  //   lucid.utils.validatorToAddress({
  //     type: "PlutusV2",
  //     script: alwaysFailValidator.cborHex,
  //   }),
  //   toUnit(deployPolicyId, fromText("FoldPolicy"))
  // );
  //
  // const [foldValidatorUTxO] = await lucid.utxosAtWithUnit(
  //   lucid.utils.validatorToAddress({
  //     type: "PlutusV2",
  //     script: alwaysFailValidator.cborHex,
  //   }),
  //   toUnit(deployPolicyId, fromText("FoldValidator"))
  // );
  //
  // const [rewardPolicyUTxO] = await lucid.utxosAtWithUnit(
  //   lucid.utils.validatorToAddress({
  //     type: "PlutusV2",
  //     script: alwaysFailValidator.cborHex,
  //   }),
  //   toUnit(deployPolicyId, fromText("RewardFoldPolicy"))
  // );
  //
  // const [rewardValidatorUTxO] = await lucid.utxosAtWithUnit(
  //   lucid.utils.validatorToAddress({
  //     type: "PlutusV2",
  //     script: alwaysFailValidator.cborHex,
  //   }),
  //   toUnit(deployPolicyId, fromText("RewardFoldValidator"))
  // );
  //
  // const [tokenHolderPolicyUTxO] = await lucid.utxosAtWithUnit(
  //   lucid.utils.validatorToAddress({
  //     type: "PlutusV2",
  //     script: alwaysFailValidator.cborHex,
  //   }),
  //   toUnit(deployPolicyId, fromText("TokenHolderPolicy"))
  // );
  //
  // const [tokenHolderValidatorUTxO] = await lucid.utxosAtWithUnit(
  //   lucid.utils.validatorToAddress({
  //     type: "PlutusV2",
  //     script: alwaysFailValidator.cborHex,
  //   }),
  //   toUnit(deployPolicyId, fromText("TokenHolderValidator"))
  // );
  //
  // const [discoveryStakeValidatorUTxO] = await lucid.utxosAtWithUnit(
  //   lucid.utils.validatorToAddress({
  //     type: "PlutusV2",
  //     script: alwaysFailValidator.cborHex,
  //   }),
  //   toUnit(deployPolicyId, fromText("DiscoveryStakeValidator"))
  // );

  writeFile(
    `./deploy-policy-${applied.version}.json`,
    JSON.stringify(
      {
        policy: deploy9.data.deployPolicyId,
        scriptsRef: scriptsRef,
      },
      undefined,
      2
    ),
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
