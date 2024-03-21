import dotenv from "dotenv";
dotenv.config();
import { insertLqNode, Lucid, Emulator } from "price-discovery-offchain";
import { setTimeout } from "timers/promises";

import { selectLucidWallet } from "../../utils/wallet.js";
import {
  MAX_WALLET_GROUP_COUNT,
  WALLET_GROUP_START_INDEX,
} from "../../constants/utils.js";
import { getAppliedScripts, getDeployedScripts } from "../../utils/files.js";

export const insertLiquidityNodesAction = async (
  lucid: Lucid,
  emulator?: Emulator,
) => {
  const applied = await getAppliedScripts();
  const deployed = await getDeployedScripts();

  const refNodePolicy = await lucid.provider.getUtxosByOutRef([
    deployed.scriptsRef.TasteTestPolicy,
  ]);
  const refNodeValidator = await lucid.provider.getUtxosByOutRef([
    deployed.scriptsRef.TasteTestValidator,
  ]);

  let loop = true;
  let walletIdx = WALLET_GROUP_START_INDEX;
  while (loop) {
    try {
      await selectLucidWallet(lucid, walletIdx);
      const tx = await insertLqNode(lucid, {
        currenTime: emulator ? emulator.now() : Date.now(),
        amountLovelace: 5_000_000n,
        scripts: {
          nodePolicy: applied.scripts.liquidityPolicy,
          nodeValidator: applied.scripts.liquidityValidator,
        },
        refScripts: {
          nodePolicy: refNodePolicy?.[0],
          nodeValidator: refNodeValidator?.[0],
        },
      });

      if (tx.type == "error") {
        console.log(tx.error);
        return undefined;
      }

      console.log("Depositing 5 ADA to TT with wallet: " + walletIdx);
      const txComplete = await tx.data.sign().complete();
      const txHash = await txComplete.submit();
      console.log(`Submitting: ${txHash}`);
      await lucid.awaitTx(txHash);

      if (walletIdx === (emulator ? 49 : MAX_WALLET_GROUP_COUNT)) {
        loop = false;
        console.log("Done!");
      } else {
        walletIdx++;
      }
    } catch (e) {
      console.log(
        "Failed to fund TT with wallet: " + walletIdx,
        (e as Error).message,
      );
      console.log("Waiting to try again...");
      await setTimeout(20_000);
    }
  }
};
