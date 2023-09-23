import { setTimeout } from "timers/promises";
import dotenv from "dotenv";
dotenv.config();
import {
  Blockfrost,
  insertNode,
  InsertNodeConfig,
  Lucid,
  Network,
  utxosAtScript,
} from "price-discovery-offchain";
import wallets from "../../test/wallets.json" assert { type: "json" };
import applied from "../../applied-scripts.json" assert { type: "json" };
import refScripts from "../../deployed-policy.json" assert { type: "json" };
import { timeoutAsyncFunction } from "./misc.js";

const lucid = await Lucid.new(
  new Blockfrost(process.env.API_URL!, process.env.API_KEY),
  process.env.NETWORK as Network
);

// lucid.selectWalletFromSeed(process.env.WALLET_PROJECT_0!);
const nodeValidatorUTxO = (
  await lucid.utxosByOutRef([refScripts.scriptsRef.DiscoveryValidator])
)[0];
const nodePolicyUTxO = (
  await lucid.utxosByOutRef([refScripts.scriptsRef.DiscoveryPolicy])
)[0];

const maxRetries = 3;

for (const [index, wallet] of wallets.entries()) {
  // offset wallet & blockchain sync
  await setTimeout(5_000);
  let retries = 0;
  while (retries < maxRetries) {
    retries > 0 ? console.log(`retrying ${retries}`) : null;

    console.log(`selecting Wallet ${index} , address: ${wallet.address}`);
    lucid.selectWalletFromSeed(wallet.seed);

    const insertNodeConfig: InsertNodeConfig = {
      nodeUTxOs: await utxosAtScript(lucid, applied.scripts.discoveryValidator),
      scripts: {
        nodeValidator: applied.scripts.discoveryValidator,
        nodePolicy: applied.scripts.discoveryPolicy,
      },
      refScripts: {
        nodeValidator: nodeValidatorUTxO,
        nodePolicy: nodePolicyUTxO,
      },
      amountLovelace: 4_000_000,
    };

    const insertNodeUnsigned = await insertNode(lucid, insertNodeConfig);
    if (insertNodeUnsigned.type == "ok") {
      try {
        const txHash = await (
          await insertNodeUnsigned.data.sign().complete()
        ).submit();
        console.log(`submitted TxHash:  ${txHash}`);
        const result = await timeoutAsyncFunction(
          lucid.awaitTx,
          txHash,
          60_000
        );
        if (result instanceof Error){
          throw result
        }
        break;
      } catch (error) {
        retries++;
        console.log(`error : ${error}`);
      }
    } else {
      retries++;
      console.log(
        `Function ${insertNode.name} failed, error : ${insertNodeUnsigned.error.message}`
      );
    }
  }
}
