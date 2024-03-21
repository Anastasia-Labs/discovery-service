import { Emulator, Lucid } from "price-discovery-offchain"

import wallets from "../../test/wallets.json" assert { type: "json" }
import { mintNFTAction } from "./mintTokenAction.js";
import { buildLiquidityScriptsAction } from "../service/liquidity/buildLiquidityScriptsAction.js";
import { deployLiquidityScriptsAction } from "../service/liquidity/deployLiquidityScriptsAction.js";
import { setTimeout } from "timers/promises";
import { initializeLiquidityAction } from "../service/liquidity/initializeLiquidityAction.js";
import { startTasteTest } from "../service/startTasteTestAction.js";
import { insertLiquidityNodesAction } from "../service/liquidity/insertLiquidityNodesAction.js";
import { EMULATOR_DELAY } from "../constants/utils.js";
import { modifyLiquidityNodesAction } from "../service/liquidity/modifyLiquidityNodesAction.js";
import { removeLiquidityNodeAction } from "../service/liquidity/removeLiquidityNodeAction.js";
import { initLiquidityFoldServiceAction } from "../service/liquidity/initLiquidityFoldServiceAction.js";
import { foldLiquidityNodesAction } from "../service/liquidity/foldLiquidityNodesAction.js";
import { liquidityAddCollectedAction } from "../service/liquidity/liquidityAddCollectedAction.js";
import { spendToProxyAction } from "../service/liquidity/spendToProxyAction.js";
import { createV1PoolAction } from "../service/liquidity/createV1PoolAction.js";
import { initLiquidityRewardServiceAction } from "../service/liquidity/initLiquidityRewardServiceAction.js";

const emulateLiquidity = async () => {
    const restAccounts = [...wallets].slice(3, 50).map(({ address }) => ({
        address,
        assets: {
            lovelace: 15_000_000n
        }
    }));

    const emulator = new Emulator([
        {
            address: wallets[0].address,
            assets: {
                lovelace: 10_000_000_000n,
            }
        },
        {
            address: wallets[1].address,
            assets: {
                lovelace: 5_000_000n
            }
        },
        {
            address: wallets[2].address,
            assets: {
                lovelace: 500_000_000n
            }
        },
        ...restAccounts,
        {
            "address": "addr_test1wz93mczshjd4zpv84csc6q6hk3w0usmrksxgx8gwqahqpqgv4p5ty",
            "assets": {
                lovelace: 2_000_000n,
                "947dd0cec86ce6106517fbcf74ce93530e1f60127be57f0a4bbc50c1666163746f7279": 1n
            },
            outputData: {
                hash: "d2653ed85dac06c5b39554b78875d4f8cb6680a274a0f2cf6897f2b99e35b0da",
            }
        }
    ])

    const deadline = emulator.now() + EMULATOR_DELAY;
    const lucidInstance = await Lucid.new(emulator);
    const DELAY = 0;
    
    lucidInstance.selectWalletFromSeed(wallets[1].seed);
    console.log("\n\n\nEMULATOR: Minting Project Token...")
    const { policyId, name } = await mintNFTAction(lucidInstance);
    console.log("Moving to next step...")
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Building Liquidity Scripts...")
    await buildLiquidityScriptsAction(lucidInstance, deadline, policyId, name);
    console.log("Moving to next step...")
    await setTimeout(DELAY);
    
    console.log("\n\n\nEMULATOR: Deploying Liquidity Scripts...")
    await deployLiquidityScriptsAction(lucidInstance, emulator);
    console.log("Moving to next step...")
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Initializing Liquidity TT...")
    await initializeLiquidityAction(lucidInstance);
    console.log("Moving to next step...")
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Starting Taste Test...")
    await startTasteTest(lucidInstance)
    console.log("Moving to next step...")
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Depositing to Taste Test...")
    await insertLiquidityNodesAction(lucidInstance, emulator);
    console.log("Moving to next step...")
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Modifying Deposits...")
    await modifyLiquidityNodesAction(lucidInstance, emulator);
    console.log("Moving to next step...")
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Removing the Last Deposit...")
    await removeLiquidityNodeAction(lucidInstance, emulator, deadline);
    console.log("Moving to next step...")
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Initializing Fold UTXO...")
    emulator.awaitBlock(150); // Ensure TT is done.
    await initLiquidityFoldServiceAction(lucidInstance, emulator);
    console.log("Moving to next step...")
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Fold Liquidity Nodes...")
    await foldLiquidityNodesAction(lucidInstance, emulator);
    console.log("Moving to next step...")
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Adding Liquidity to Token Holder...")
    await liquidityAddCollectedAction(lucidInstance, emulator);
    console.log("Moving to next step...")
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Spending to Proxy Token Holder...")
    const proxyDatum = await spendToProxyAction(lucidInstance, emulator);
    console.log("Moving to next step...")
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Creating V1 Pool...")
    await createV1PoolAction(lucidInstance, emulator, proxyDatum, policyId, name);
    console.log("Moving to next step...")
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Initializing Reward Fold...")
    await initLiquidityRewardServiceAction(lucidInstance, emulator, policyId, name);
    console.log("Moving to next step...")
    await setTimeout(DELAY);
}

emulateLiquidity();