import dotenv from "dotenv";
dotenv.config();
import { writeFile } from "node:fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Blockfrost,
  fromText,
  Lucid,
  Network,
  toUnit,
} from "lucid-cardano";
import { buildLiquidityScripts } from "price-discovery-offchain";

import discoveryValidator from "../../compiled/liquidity/discoveryValidator.json" assert { type: "json" };
import discoveryPolicy from "../../compiled/liquidity/discoveryMinting.json" assert { type: "json" };
import discoveryStake from "../../compiled/liquidity/discoveryStakeValidator.json" assert { type: "json" };
import foldPolicy from "../../compiled/liquidity/foldMint.json" assert { type: "json" };
import foldValidator from "../../compiled/liquidity/foldValidator.json" assert { type: "json" };
import rewardPolicy from "../../compiled/liquidity/rewardFoldMint.json" assert { type: "json" };
import rewardValidator from "../../compiled/liquidity/rewardFoldValidator.json" assert { type: "json" };
import tokenHolderPolicy from "../../compiled/tokenHolderPolicy.json" assert { type: "json" };
import tokenHolderValidator from "../../compiled/tokenHolderValidator.json" assert { type: "json" };

const run = async () => {
  const lucid = await Lucid.new(
    new Blockfrost(process.env.API_URL!, process.env.API_KEY),
    process.env.NETWORK as Network
  );

  //NOTE: STEP 1 Fund all wallets with at least 500 ADA each before proceding, make sure WALLET_PROJECT_1 has project token
  //
  const beneficiaryAddress = process.env.BENEFICIARY_ADDRESS!
  const [project0UTxO] = await lucid
    .selectWalletFromSeed(process.env.WALLET_PROJECT_0!)
    .wallet.getUtxos();
  const [project1UTxO] = await lucid
    .selectWalletFromSeed(process.env.WALLET_PROJECT_1!)
    .wallet.getUtxos();

  const checkProjectToken = (
    await lucid
      .selectWalletFromSeed(process.env.WALLET_PROJECT_1!)
      .wallet.getUtxos()
  ).find((utxo) => {
    return (
      utxo.assets[
        toUnit(process.env.PROJECT_CS!, fromText(process.env.PROJECT_TN!))
      ] == BigInt(Number(process.env.PROJECT_AMNT!))
    );
  });

  if (!checkProjectToken) {
    console.log("WALLET_PROJECT_1 project token missing");
    console.log(
      `Send project ${
        Number(process.env.PROJECT_AMNT!) / 1_000_000
      } token to: `,
      await lucid
        .selectWalletFromSeed(process.env.WALLET_PROJECT_1!)
        .wallet.address()
    );
    return;
  }

  // const deadline = Date.now() + TWENTY_FOUR_HOURS_MS * 5; // 5 days
  const deadline = Number(process.env.DEADLINE);
  console.log("Deadline UTC", new Date(deadline).toUTCString());

  const scripts = buildLiquidityScripts(lucid,
    {
        liquidityPolicy: {
            initUTXO: project0UTxO,
            deadline,
            penaltyAddress: beneficiaryAddress
          },
          rewardFoldValidator: {
            projectCS: process.env.PROJECT_CS!,
            projectTN: process.env.PROJECT_TN!,
            projectAddr: beneficiaryAddress,
          },
          projectTokenHolder: {
            initUTXO: project1UTxO,
          },
          unapplied: {
            liquidityPolicy: discoveryPolicy.cborHex,
            liquidityValidator: discoveryValidator.cborHex,
            liquidityStake: discoveryStake.cborHex,
            collectFoldPolicy: foldPolicy.cborHex,
            collectFoldValidator: foldValidator.cborHex,
            distributionFoldPolicy: rewardPolicy.cborHex,
            distributionFoldValidator: rewardValidator.cborHex,
            tokenHolderValidator: tokenHolderPolicy.cborHex,
            tokenHolderPolicy: tokenHolderValidator.cborHex,
          }
    }
//     {
//     discoveryPolicy: {
//       initUTXO: project0UTxO,
//       deadline: deadline,
//       penaltyAddress: beneficiaryAddress,
//     },
//     rewardValidator: {
//       projectCS: process.env.PROJECT_CS!,
//       projectTN: process.env.PROJECT_TN!,
//       projectAddr: beneficiaryAddress,
//     },
//     projectTokenHolder: {
//       initUTXO: project1UTxO,
//     },
//     unapplied: {
//       discoveryPolicy: discoveryPolicy.cborHex,
//       discoveryValidator: discoveryValidator.cborHex,
//       discoveryStake: discoveryStake.cborHex,
//       foldPolicy: foldPolicy.cborHex,
//       foldValidator: foldValidator.cborHex,
//       rewardPolicy: rewardPolicy.cborHex,
//       rewardValidator: rewardValidator.cborHex,
//       tokenHolderPolicy: tokenHolderPolicy.cborHex,
//       tokenHolderValidator: tokenHolderValidator.cborHex,
//     },
//   }
  );

  if (scripts.type == "error") return;

  const currenTime = Date.now();

  const parameters = {
    liquidityPolicy: {
        initUTXO: project0UTxO,
        deadline,
        penaltyAddress: beneficiaryAddress
    },
    rewardFoldValidator: {
        projectCS: process.env.PROJECT_CS!,
        projectTN: process.env.PROJECT_TN!,
        projectAddr: beneficiaryAddress,
    },
    projectTokenHolder: {
     initUTXO: project1UTxO,
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
