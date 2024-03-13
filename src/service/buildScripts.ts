import dotenv from "dotenv";
dotenv.config();
import { writeFile } from "node:fs";
import {
  buildScripts,
  fromText,
  toUnit,
} from "price-discovery-offchain";
import discoveryValidator from "../compiled/discoveryValidator.json" assert { type: "json" };
import discoveryPolicy from "../compiled/discoveryMinting.json" assert { type: "json" };
import discoveryStake from "../compiled/discoveryStakeValidator.json" assert { type: "json" };
import foldPolicy from "../compiled/foldMint.json" assert { type: "json" };
import foldValidator from "../compiled/foldValidator.json" assert { type: "json" };
import rewardPolicy from "../compiled/rewardFoldMint.json" assert { type: "json" };
import rewardValidator from "../compiled/rewardFoldValidator.json" assert { type: "json" };
import tokenHolderPolicy from "../compiled/tokenHolderPolicy.json" assert { type: "json" };
import tokenHolderValidator from "../compiled/tokenHolderValidator.json" assert { type: "json" };

import { getLucidInstance, selectLucidWallet } from "../utils/wallet.js";

const run = async () => {
  const wallet0 = await selectLucidWallet(0);
  const wallet1 = await selectLucidWallet(1);

  //NOTE: STEP 1 Fund all wallets with at least 500 ADA each before proceding, make sure WALLET_PROJECT_1 has project token
  //
  const beneficiaryAddress = process.env.BENEFICIARY_ADDRESS!
  const project0Utxos = await wallet0.wallet.getUtxos();
  const project1Utxos = await wallet1.wallet.getUtxos();

  const checkProjectToken = (
    project1Utxos
  ).find((utxo) => {
    return (
      utxo.assets[
        toUnit(process.env.PROJECT_CS!, fromText(process.env.PROJECT_TN!))
      ] === BigInt(Number(process.env.PROJECT_AMNT!))
    );
  });

  if (!checkProjectToken) {
    console.log("WALLET_PROJECT_1 project token missing");
    console.log(
      `Send project ${
        Number(process.env.PROJECT_AMNT!) / 1_000_000
      } token to: `,
      await wallet1
        .wallet.address()
    );
    return;
  }

  // const deadline = Date.now() + TWENTY_FOUR_HOURS_MS * 5; // 5 days
  const deadline = Number(process.env.DEADLINE);
  console.log("Deadline UTC", new Date(deadline).toUTCString());

  const lucid = await getLucidInstance();
  const scripts = buildScripts(lucid, {
    discoveryPolicy: {
      initUTXO: project0Utxos[0],
      deadline: deadline,
      penaltyAddress: beneficiaryAddress,
    },
    rewardValidator: {
      projectCS: process.env.PROJECT_CS!,
      projectTN: process.env.PROJECT_TN!,
      projectAddr: beneficiaryAddress,
    },
    projectTokenHolder: {
      initUTXO: project1Utxos[0],
    },
    unapplied: {
      discoveryPolicy: discoveryPolicy.cborHex,
      discoveryValidator: discoveryValidator.cborHex,
      discoveryStake: discoveryStake.cborHex,
      foldPolicy: foldPolicy.cborHex,
      foldValidator: foldValidator.cborHex,
      rewardPolicy: rewardPolicy.cborHex,
      rewardValidator: rewardValidator.cborHex,
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
