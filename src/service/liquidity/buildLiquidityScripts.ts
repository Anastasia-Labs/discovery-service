import dotenv from "dotenv";
dotenv.config();
import { writeFile } from "node:fs";
import {
  fromText,
  buildLiquidityScripts,
  toUnit,
} from "price-discovery-offchain";

import liquidityValidator from "../../compiledLiquidity/liquidityValidator.json" assert { type: "json" };
import liquidityPolicy from "../../compiledLiquidity/liquidityMinting.json" assert { type: "json" };
import liquidityStake from "../../compiledLiquidity/liquidityStakeValidator.json" assert { type: "json" };
import collectionFoldPolicy from "../../compiledLiquidity/liquidityFoldMint.json" assert { type: "json" };
import collectionFoldValidator from "../../compiledLiquidity/liquidityFoldValidator.json" assert { type: "json" };
import distributionFoldPolicy from "../../compiledLiquidity/distributionRewardFoldMint.json" assert { type: "json" };
import distributionFoldValidator from "../../compiledLiquidity/distributionFoldValidator.json" assert { type: "json" };
import tokenHolderPolicy from "../../compiledLiquidity/liquidityTokenHolderMint.json" assert { type: "json" };
import tokenHolderValidator from "../../compiledLiquidity/liquidityTokenHolderValidator.json" assert { type: "json" };

import { getLucidInstance, selectLucidWallet } from "../../utils/wallet.js";

const run = async () => {
  const lucid = await getLucidInstance();
  const wallet0 = await selectLucidWallet(0);
  const project0Utxos = await wallet0.wallet.getUtxos();
  const wallet1 = await selectLucidWallet(1);
  const project1Utxos = await wallet1.wallet.getUtxos();

  //NOTE: STEP 1 Fund all wallets with at least 500 ADA each before proceding, make sure WALLET_PROJECT_1 has project token
  //
  const beneficiaryAddress = process.env.BENEFICIARY_ADDRESS!

  const checkProjectToken = project1Utxos.find((utxo) => {
    return (
      utxo.assets[
        toUnit(process.env.PROJECT_CS!, fromText(process.env.PROJECT_TN!))
      ] === BigInt(process.env.PROJECT_AMNT!)
    );
  });

  if (!checkProjectToken) {
    console.log("WALLET_PROJECT_1 project token missing");
    console.log(
      `Send project ${
        Number(process.env.PROJECT_AMNT!) / 1_000_000
      } token to: `,
      await wallet1.wallet.address()
    );
    return;
  }

  // const deadline = Date.now() + TWENTY_FOUR_HOURS_MS * 5; // 5 days
  const deadline = Number(process.env.DEADLINE);
  console.log("Deadline UTC", deadline, new Date(deadline).toUTCString());

  const scripts = buildLiquidityScripts(lucid, {
    liquidityPolicy: {
      initUTXO: project0Utxos[0],
      deadline: deadline,
      penaltyAddress: beneficiaryAddress,
    },
    rewardFoldValidator: {
      projectCS: process.env.PROJECT_CS!,
      projectLpPolicyId: process.env.POOL_POLICY_ID!,
      projectAddr: beneficiaryAddress,
    },
    projectTokenHolder: {
      initUTXO: project1Utxos[0],
    },
    unapplied: {
      liquidityPolicy: liquidityPolicy.cborHex,
      liquidityValidator: liquidityValidator.cborHex,
      liquidityStake: liquidityStake.cborHex,
      collectFoldPolicy: collectionFoldPolicy.cborHex,
      collectFoldValidator: collectionFoldValidator.cborHex,
      distributionFoldPolicy: distributionFoldPolicy.cborHex,
      distributionFoldValidator: distributionFoldValidator.cborHex,
      tokenHolderPolicy: tokenHolderPolicy.cborHex,
      tokenHolderValidator: tokenHolderValidator.cborHex,
    },
  });

  if (scripts.type == "error") return;

  const currenTime = Date.now();

  const parameters = {
    discoveryPolicy: {
      initOutRef: {
        txHash: project0Utxos[0].txHash,
        outputIndex: project0Utxos[0].outputIndex
      },
      deadline: deadline,
      penaltyAddress: beneficiaryAddress,
    },
    rewardValidator: {
      projectCS: process.env.PROJECT_CS!,
      projectTN: process.env.PROJECT_TN!,
      projectAddr: beneficiaryAddress,
    },
    projectTokenHolder: {
      initOutRef: {
        txHash: project1Utxos[0].txHash,
        outputIndex: project1Utxos[0].outputIndex
      },
    },
  };

  writeFile(
    `./applied-scripts.json`,
    JSON.stringify(
      {
        ...{ scripts: scripts.data },
        ...{ version: currenTime },
        ...{ projectAmount: Number(process.env.PROJECT_AMNT) },
        ...parameters,
      },
      undefined,
      2
    ),
    (error) => {
      error
        ? console.log(error)
        : console.log(`Scripts have been saved , version ${currenTime}\n`);
    }
  );
};
await run();
