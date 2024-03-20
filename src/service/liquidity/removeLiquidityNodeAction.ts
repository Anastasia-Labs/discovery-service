import dotenv from "dotenv";
dotenv.config();
import { 
    removeLqNode
} from "price-discovery-offchain"
import { Lucid, Emulator } from "price-discovery-offchain"

import applied from "../../../applied-scripts.json" assert { type: "json" };
import { selectLucidWallet } from "../../utils/wallet.js";
import { MAX_WALLET_GROUP_COUNT } from "../../constants/utils.js";

export const removeLiquidityNodeAction = async (lucid: Lucid, emulator?: Emulator, emulatorDeadline?: number) => {
    await selectLucidWallet(lucid, MAX_WALLET_GROUP_COUNT - 1);

    const tx = await removeLqNode(lucid, {
        currenTime: emulator?.now() ?? Date.now(),
        penaltyAddress: process.env.BENEFICIARY_ADDRESS as string,
        scripts: {
            nodePolicy: applied.scripts.liquidityPolicy,
            nodeValidator: applied.scripts.liquidityValidator
        },
        deadline: emulatorDeadline ?? Number(process.env.DEADLINE) as number
    })

    if (tx.type == "error") {
        console.log(tx.error);
        return;
      }

    const txComplete = await tx.data.sign().complete();
    const txHash = await txComplete.submit();
    console.log(`Submitting: ${txHash}`)
    await lucid.awaitTx(txHash)
    console.log("Done!")
}