import dotenv from "dotenv";
dotenv.config();
import { writeFile } from "node:fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  Blockfrost,
  buildScripts,
  Lucid,
  Network,
  TWENTY_FOUR_HOURS_MS,
} from "price-discovery-offchain";
import discoveryValidator from "./compiled/discoveryValidator.json" assert { type: "json" };
import discoveryPolicy from "./compiled/discoveryMinting.json" assert { type: "json" };
import discoveryStake from "./compiled/discoveryStakeValidator.json" assert { type: "json" };
import foldPolicy from "./compiled/foldMint.json" assert { type: "json" };
import foldValidator from "./compiled/foldValidator.json" assert { type: "json" };
import rewardPolicy from "./compiled/rewardFoldMint.json" assert { type: "json" };
import rewardValidator from "./compiled/rewardFoldValidator.json" assert { type: "json" };
import tokenHolderPolicy from "./compiled/tokenHolderPolicy.json" assert { type: "json" };
import tokenHolderValidator from "./compiled/tokenHolderValidator.json" assert { type: "json" };
import alwaysFailValidator from "./compiled/alwaysFails.json";

const run = async () => {
  const lucid = await Lucid.new(
    new Blockfrost(process.env.API_URL!, process.env.API_KEY),
    process.env.NETWORK as Network
  );
  //NOTE: STEP 1 Fund both wallets with 500 ADA each before proceding
  //
  const treasuryAddress = await lucid
    .selectWalletFromSeed(process.env.WALLET_BENEFICIARY_1!)
    .wallet.address();
  const [treasuryUTxO] = await lucid
    .selectWalletFromSeed(process.env.WALLET_BENEFICIARY_1!)
    .wallet.getUtxos();
  const [project1UTxO] = await lucid
    .selectWalletFromSeed(process.env.WALLET_PROJECT_1!)
    .wallet.getUtxos();
  const deadline = Date.now() + TWENTY_FOUR_HOURS_MS * 5; // 5 days

  const scripts = buildScripts(lucid, {
    discoveryPolicy: {
      initUTXO: treasuryUTxO,
      deadline: deadline,
      penaltyAddress: treasuryAddress,
    },
    rewardValidator: {
      projectCS: process.env.PROJECT_CS!,
      projectTN: process.env.PROJECT_TN!,
      projectAddr: treasuryAddress,
    },
    projectTokenHolder: {
      initUTXO: project1UTxO,
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

  const currenTime = Date.now()

  writeFile(
    `./applied-scripts-${currenTime}.json`,
    JSON.stringify({...scripts.data,...{version: currenTime }}, undefined, 2),
    (error) => {
      error
        ? console.log(error)
        : console.log(
            `Scripts have been saved \n
          penaltyAddress: ${treasuryAddress} \n
          projectCS: ${process.env.PROJECT_CS} \n
          projectTN: ${process.env.PROJECT_TN}
          `
          );
    }
  );
};
await run();
