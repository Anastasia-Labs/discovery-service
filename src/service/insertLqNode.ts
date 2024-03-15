import dotenv from "dotenv";
dotenv.config();
import { 
    insertLqNode
} from "price-discovery-offchain"

import applied from "../../applied-scripts.json" assert { type: "json" };
import refScripts from "../../deployed-policy.json" assert { type: "json" };
import { loggerDD } from "../logs/datadog-service.js";
import { UTxO } from "@anastasia-labs/lucid-cardano-fork";
import { getLucidInstance, selectLucidWallet } from "../utils/wallet.js";

async function run() {
    const lucid = await selectLucidWallet(0);

    const tx = await insertLqNode(lucid, {
        amountLovelace: 100_000_000,
        scripts: {
            nodePolicy: applied.scripts.liquidityPolicy,
            nodeValidator: applied.scripts.liquidityValidator
        }
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