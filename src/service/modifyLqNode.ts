import dotenv from "dotenv";
dotenv.config();
import {
    modifyLqNode,
} from "price-discovery-offchain"

import applied from "../../applied-scripts.json" assert { type: "json" };
import { getLucidInstance, selectLucidWallet } from "../utils/wallet.js";

async function run() {
    const lucid = await getLucidInstance();

    let loop = true;
    let walletIdx = 3;
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
            if (walletIdx === 13) {
                loop = false;
            } else {
                walletIdx++;
            }
        } catch (e) {
            console.log("Failed to update TT with wallet: " + walletIdx, (e as Error).message);
        }
    }
}

run();