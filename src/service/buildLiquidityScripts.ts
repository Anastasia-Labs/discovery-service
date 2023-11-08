import dotenv from "dotenv";
dotenv.config();
import { writeFile } from "node:fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Blockfrost,
  buildScripts,
  fromText,
  buildLiquidityScripts,
  Lucid,
  Network,
  toUnit,
  TWENTY_FOUR_HOURS_MS,
} from "price-discovery-offchain";
import liquidityValidator from "../compiledLiquidity/liquidityValidator.json" assert { type: "json" };
import liquidityPolicy from "../compiledLiquidity/liquidityMinting.json" assert { type: "json" };
import liquidityStake from "../compiledLiquidity/liquidityStakeValidator.json" assert { type: "json" };
import collectionFoldPolicy from "../compiledLiquidity/collectionFoldMint.json" assert { type: "json" };
import collectionFoldValidator from "../compiledLiquidity/collectionFoldValidator.json" assert { type: "json" };
import distributionFoldPolicy from "../compiledLiquidity/distributionFoldMint.json" assert { type: "json" };
import distributionFoldValidator from "../compiledLiquidity/distributionFoldValidator.json" assert { type: "json" };
import tokenHolderPolicy from "../compiled/tokenHolderPolicy.json" assert { type: "json" };
import tokenHolderValidator from "../compiled/tokenHolderValidator.json" assert { type: "json" };
import alwaysFailValidator from "../compiled/alwaysFails.json";

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

  const scripts = buildLiquidityScripts(lucid, {
    liquidityPolicy: {
      initUTXO: project0UTxO,
      deadline: deadline,
      penaltyAddress: beneficiaryAddress,
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
        txHash: project0UTxO.txHash,
        outputIndex: project0UTxO.outputIndex,
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
        txHash: project1UTxO.txHash,
        outputIndex: project1UTxO.outputIndex,
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
