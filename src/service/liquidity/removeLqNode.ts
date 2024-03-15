import dotenv from "dotenv";
dotenv.config();
import { 
    removeLqNode
} from "price-discovery-offchain"

import applied from "../../../applied-scripts.json" assert { type: "json" };
import { selectLucidWallet } from "../../utils/wallet.js";

async function run() {
    const lucid = await selectLucidWallet(10);

    const tx = await removeLqNode(lucid, {
        penaltyAddress: process.env.BENEFICIARY_ADDRESS as string,
        scripts: {
            nodePolicy: applied.scripts.liquidityPolicy,
            nodeValidator: applied.scripts.liquidityValidator
        },
        deadline: Number(process.env.DEADLINE) as number
    })

    if (tx.type == "error") {
        console.log(tx.error);
        return;
      }

    const txComplete = await tx.data.sign().complete();
    const txHash = await txComplete.submit();
    await lucid.awaitTx(txHash)
    console.log(txHash);
}

run();