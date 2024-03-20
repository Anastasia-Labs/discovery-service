import dotenv from "dotenv";
dotenv.config();
import {
    modifyLqNode,
} from "price-discovery-offchain"
import { Lucid, Emulator } from "price-discovery-offchain";
import { setTimeout } from "timers/promises";

import { selectLucidWallet } from "../../utils/wallet.js";
import { MAX_WALLET_GROUP_COUNT, WALLET_GROUP_START_INDEX } from "../../constants/utils.js";

export const modifyLiquidityNodesAction = async (lucid: Lucid, emulator?: Emulator) => {
    const { default: applied } = await import("../../../applied-scripts.json", { assert: { type: "json" } })

    let loop = true;
    let walletIdx = WALLET_GROUP_START_INDEX;
    while (loop) {
        try {
            await selectLucidWallet(lucid, walletIdx);
            const tx = await modifyLqNode(lucid, {
                currenTime: emulator?.now() ?? Date.now(),
                amountLovelace: 1_000_000n,
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
            console.log(`Submitting: ${txHash}`);
    
            if (walletIdx === MAX_WALLET_GROUP_COUNT) {
                loop = false;
                console.log("Done!")
            } else {
                walletIdx++;
                await lucid.awaitTx(txHash);
            }
        } catch (e) {
            console.log("Failed to fund TT with wallet: " + walletIdx, (e as Error).message);
            console.log("Waiting to try again...")
            await setTimeout(20_000)
        }
    }
}