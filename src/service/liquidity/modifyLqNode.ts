import dotenv from "dotenv";
dotenv.config();
import {
    modifyLqNode,
} from "price-discovery-offchain"

import applied from "../../../applied-scripts.json" assert { type: "json" };
import { getLucidInstance, selectLucidWallet } from "../../utils/wallet.js";
import { setTimeout } from "timers/promises";

async function run() {
    const lucid = await getLucidInstance();

    let loop = true;
    let walletIdx = 5;
    while (loop) {
        try {
            await selectLucidWallet(walletIdx);
            const tx = await modifyLqNode(lucid, {
                amountLovelace: 1_000_000,
                scripts: {
                    nodePolicy: applied.scripts.liquidityPolicy,
                    nodeValidator: applied.scripts.liquidityValidator
                }
            })
        
            if (tx.type == "error") {
                console.log(tx.error);
                return undefined;
            }
        
            console.log("Updating deposit with 1 ADA using wallet: " + walletIdx)
            const txComplete = await tx.data.sign().complete();
            const txHash = await txComplete.submit();
            console.log(`Done: ${txHash}`);
    
            // Stop after wallet index 13
            if (walletIdx === 10) {
                loop = false;
            } else {
                walletIdx++;
                await setTimeout(20_000)
            }
        } catch (e) {
            console.log("Failed to fund TT with wallet: " + walletIdx, (e as Error).message);
            console.log("Waiting to try again...")
            await setTimeout(20_000)
        }
    }
}

run();