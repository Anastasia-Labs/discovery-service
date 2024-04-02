import { Emulator, Lucid } from "price-discovery-offchain";
import { setTimeout } from "timers/promises";
import "./env.js";

import { claimLiquidityNodeAction } from "../service/liquidity/claimLiquidityNodeAction.js";
import { createV1PoolAction } from "../service/liquidity/createV1PoolAction.js";
import { foldLiquidityNodesAction } from "../service/liquidity/foldLiquidityNodesAction.js";
import { foldLiquidityRewardsAction } from "../service/liquidity/foldLiquidityRewardsAction.js";
import { initLiquidityFoldServiceAction } from "../service/liquidity/initLiquidityFoldServiceAction.js";
import { initLiquidityRewardServiceAction } from "../service/liquidity/initLiquidityRewardServiceAction.js";
import { liquidityAddCollectedAction } from "../service/liquidity/liquidityAddCollectedAction.js";
import { spendToProxyAction } from "../service/liquidity/spendToProxyAction.js";
import { getEmulatorLedger, getLucidInstance, posixToSlot } from "./wallet.js";

const emulateLiquidity = async () => {
  const lucid = await getLucidInstance();
  const utxos = await getEmulatorLedger(lucid, true);
  const emulator = new Emulator(utxos);
  const deadline = posixToSlot(process.env.DEADLINE!);
  const network = process.env.NODE_ENV?.includes("mainnet")
    ? "Mainnet"
    : "Preview";
  const lucidInstance = await Lucid.new(emulator, network);
  const DELAY = 0;

  try {
    console.log("\n\n\nEMULATOR: Initializing Fold UTXO...");
    emulator.awaitSlot(deadline + 1000);
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
    if (false) {
    }
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
