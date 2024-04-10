import {
  Assets,
  Emulator,
  Lucid,
  OutputData,
  PROTOCOL_PARAMETERS_DEFAULT,
  ProtocolParameters,
} from "price-discovery-offchain";
import "./env.js";

import { existsSync } from "fs";
import { rm } from "fs/promises";
import inquirer from "inquirer";
import { setTimeout } from "timers/promises";

import {
  MIN_ADA_INSERT_WALLET,
  getPublishWalletAda,
} from "../constants/utils.js";
import { buildLiquidityScriptsAction } from "../service/liquidity/buildLiquidityScriptsAction.js";
import { claimLiquidityNodeAction } from "../service/liquidity/claimLiquidityNodeAction.js";
import { createTasteTestAction } from "../service/liquidity/createTasteTestAction.js";
import { createV1PoolAction } from "../service/liquidity/createV1PoolAction.js";
import { foldLiquidityNodesAction } from "../service/liquidity/foldLiquidityNodesAction.js";
import { foldLiquidityRewardsAction } from "../service/liquidity/foldLiquidityRewardsAction.js";
import { fragmentPublishWalletAction } from "../service/liquidity/fragmentPublishWalletAction.js";
import { initLiquidityFoldServiceAction } from "../service/liquidity/initLiquidityFoldServiceAction.js";
import { initLiquidityRewardServiceAction } from "../service/liquidity/initLiquidityRewardServiceAction.js";
import { initTokenHolderAction } from "../service/liquidity/initTokenHolderAction.js";
import { initializeLiquidityAction } from "../service/liquidity/initializeLiquidityAction.js";
import { insertLiquidityNodesAction } from "../service/liquidity/insertLiquidityNodesAction.js";
import { liquidityAddCollectedAction } from "../service/liquidity/liquidityAddCollectedAction.js";
import { modifyLiquidityNodesAction } from "../service/liquidity/modifyLiquidityNodesAction.js";
import { publishLiquidityScriptsAction } from "../service/liquidity/publishLiquidityScriptsAction.js";
import { registerStakeAction } from "../service/liquidity/registerStakeAction.js";
import { removeLiquidityNodeAction } from "../service/liquidity/removeLiquidityNodeAction.js";
import { spendToProxyAction } from "../service/liquidity/spendToProxyAction.js";
import { getNetwork } from "./args.js";
import { getTTConfig, getTransactionFilesPath, getWallets } from "./files.js";
import { mintTokenAction } from "./mintTokenAction.js";
import { posixToSlot } from "./wallet.js";

const emulateLiquidity = async () => {
  const { scriptType } = await getTTConfig();
  const wallets = await getWallets();
  const restAccounts = [...wallets].slice(3).map(({ address }) => ({
    address,
    assets: {
      lovelace: MIN_ADA_INSERT_WALLET,
    },
  }));

  const protocolParams: ProtocolParameters | undefined =
    scriptType === "binds"
      ? {
          ...PROTOCOL_PARAMETERS_DEFAULT,
          maxTxSize: 20_000_000_000,
          maxTxExMem: 20_000_000_000n,
          maxTxExSteps: 20_000_000_000n,
        }
      : undefined;

  const utxos: {
    address: string;
    assets: Assets;
    outputData?: OutputData;
    txHash?: string;
    txIndex?: number;
  }[] = [
    {
      address: wallets[0].address,
      assets: {
        lovelace: 10_000_000_000n,
      },
    },
    {
      address: wallets[1].address,
      assets: {
        lovelace: 5_000_000n,
      },
    },
    {
      address: wallets[2].address,
      assets: {
        lovelace: await getPublishWalletAda(),
      },
    },
    ...restAccounts,
  ];

  if (getNetwork() === "mainnet") {
    utxos.push({
      address: "addr1w82z6yrftsxz77el0ce2q4vuspcym2x0xgpgneurrwvasfge778fd",
      assets: {
        lovelace: 2_000_000n,
        e8a447d4e19016ca2aa74d20b4c4de87adb1f21dfb5493bf2d7281a6666163746f7279:
          1n,
      },
      outputData: {
        hash: "24aa61609c74285e0d02f7adebb258cc9de480e0bd59207cd1a5f76793dc0c07",
      },
    });
  } else {
    utxos.push({
      address:
        "addr_test1wz93mczshjd4zpv84csc6q6hk3w0usmrksxgx8gwqahqpqgv4p5ty",
      assets: {
        lovelace: 2_000_000n,
        "947dd0cec86ce6106517fbcf74ce93530e1f60127be57f0a4bbc50c1666163746f7279":
          1n,
      },
      outputData: {
        hash: "d2653ed85dac06c5b39554b78875d4f8cb6680a274a0f2cf6897f2b99e35b0da",
      },
    });
  }

  const emulator = new Emulator(utxos, protocolParams);
  const network = getNetwork() === "mainnet" ? "Mainnet" : "Preview";
  const lucidInstance = await Lucid.new(emulator, network);
  const DELAY = 250;

  try {
    if (existsSync(getTransactionFilesPath())) {
      const data = await inquirer.prompt([
        {
          type: "confirm",
          name: "proceedWithRemoval",
          message:
            "Transactions already exist. Clean the folder for emulating?",
          default: true,
        },
      ]);

      if (data.proceedWithRemoval) {
        console.log("\n\n\nEMULATOR: Cleaning transaction folder...");
        await rm(getTransactionFilesPath(), { recursive: true, force: true });
      }
    }

    console.log("\n\n\nEMULATOR: Building New Config...");
    await createTasteTestAction(emulator);
    console.log("Moving to next step...");
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Minting Project Token...");
    await mintTokenAction(lucidInstance, emulator);
    console.log("Moving to next step...");
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Building Liquidity Scripts...");
    await buildLiquidityScriptsAction(lucidInstance, emulator);
    console.log("Moving to next step...");
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Fragmenting Publishing Wallet...");
    await fragmentPublishWalletAction(lucidInstance, emulator);
    console.log("Moving to next step...");
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Deploying Liquidity Scripts...");
    await publishLiquidityScriptsAction(lucidInstance, emulator);
    console.log("Moving to next step...");
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Initializing Liquidity TT...");
    await registerStakeAction(lucidInstance, emulator);
    console.log("Moving to next step...");
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Initializing Token Holder...");
    await initTokenHolderAction(lucidInstance, emulator);
    console.log("Moving to next step...");
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Starting TT...");
    await initializeLiquidityAction(lucidInstance, emulator);
    console.log("Moving to next step...");
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Depositing to Taste Test...");
    await insertLiquidityNodesAction(lucidInstance, emulator);
    console.log("Moving to next step...");
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Modifying Deposits...");
    await modifyLiquidityNodesAction(lucidInstance, emulator);
    console.log("Moving to next step...");
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Removing Some Deposits with Penalty...");
    await removeLiquidityNodeAction(lucidInstance, emulator);
    console.log("Moving to next step...");
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Initializing Fold UTXO...");
    emulator.awaitSlot(posixToSlot((await getTTConfig()).deadline) + 1000);
    await initLiquidityFoldServiceAction(lucidInstance, emulator);
    console.log("Moving to next step...");
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Fold Liquidity Nodes...");
    await foldLiquidityNodesAction(lucidInstance, emulator);
    console.log("Moving to next step...");
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Adding Liquidity to Token Holder...");
    await liquidityAddCollectedAction(lucidInstance, emulator);
    console.log("Moving to next step...");
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Spending to Proxy Token Holder...");
    await spendToProxyAction(lucidInstance, emulator);
    console.log("Moving to next step...");
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Creating V1 Pool...");
    await createV1PoolAction(lucidInstance, emulator);
    console.log("Moving to next step...");
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Initializing Reward Fold...");
    await initLiquidityRewardServiceAction(lucidInstance, emulator);
    console.log("Moving to next step...");
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Distributing Rewards...");
    await foldLiquidityRewardsAction(lucidInstance, emulator);
    console.log("Moving to next step...");
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Claiming a Reward...");
    await claimLiquidityNodeAction(lucidInstance, emulator);
    await setTimeout(DELAY);
  } catch (e) {
    console.log("Something went wrong. Error:", e);
    return;
  }

  console.log(`
  \x1b[32m
      You Did It! You are the
      
  ██████╗  ██████╗ ███████╗███████╗
  ██╔══██╗██╔═══██╗██╔════╝██╔════╝
  ██████╔╝██║   ██║███████╗███████╗
  ██╔══██╗██║   ██║╚════██║╚════██║
  ██████╔╝╚██████╔╝███████║███████║
  ╚═════╝  ╚═════╝ ╚══════╝╚══════╝
  \x1b[0m
  `);
};

emulateLiquidity();
