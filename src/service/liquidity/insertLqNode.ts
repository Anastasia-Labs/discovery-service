import dotenv from "dotenv";
dotenv.config();
import { 
    insertLqNode
} from "price-discovery-offchain"

import applied from "../../../applied-scripts.json" assert { type: "json" };
import { getLucidInstance, selectLucidWallet } from "../../utils/wallet.js";
import { setTimeout } from "timers/promises";

async function run() {
    const lucid = await getLucidInstance();

    let loop = true;
    let walletIdx = 8;
    while (loop) {
        try {
            await selectLucidWallet(walletIdx);
            const tx = await insertLqNode(lucid, {
                amountLovelace: 5_000_000,
                scripts: {
                    nodePolicy: applied.scripts.liquidityPolicy,
                    nodeValidator: applied.scripts.liquidityValidator
                }
            })
        
            if (tx.type == "error") {
                console.log(tx.error);
                return undefined;
            }
        
            console.log("Depositing 5 ADA to TT with wallet: " + walletIdx)
            const txComplete = await tx.data.sign().complete();
            const txHash = await txComplete.submit();
            console.log(`Done: ${txHash}`);
    
            // Stop after wallet index 13
            if (walletIdx === 12) {
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