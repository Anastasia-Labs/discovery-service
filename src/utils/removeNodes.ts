import { setTimeout } from "timers/promises";
import dotenv from "dotenv";
dotenv.config();
import {
  Blockfrost,
  Lucid,
  Network,
  parseUTxOsAtScript,
  removeNode,
  RemoveNodeConfig,
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

for (const wallet of wallets) {
  lucid.selectWalletFromSeed(wallet.seed);
  console.log("\n wallet ", wallet.address);

  // offset wallet & blockchain sync
  await setTimeout(1_000);
  let retries = 0;
  while (retries < maxRetries) {
    retries > 0 ? console.log(`retrying ${retries}`) : null;

    const removeNodeConfig: RemoveNodeConfig = {
      nodeUTxOs: await utxosAtScript(lucid, applied.scripts.discoveryValidator),
      scripts: {
        nodeValidator: applied.scripts.discoveryValidator,
        nodePolicy: applied.scripts.discoveryPolicy,
      },
      refScripts: {
        nodeValidator: nodeValidatorUTxO,
        nodePolicy: nodePolicyUTxO,
      },
      deadline: applied.discoveryPolicy.deadline,
      penaltyAddress: process.env.BENEFICIARY_ADDRESS!,
    };

    const removeNodeUnsigned = await removeNode(lucid, removeNodeConfig);
    if (removeNodeUnsigned.type == "ok") {
      try {
        const txHash = await (
          await removeNodeUnsigned.data.sign().complete()
        ).submit();
        const result = await Promise.race([
          lucid.awaitTx(txHash),
          setTimeout(120_000, null),
        ]);
        if (!result) {
          throw new Error("timeout async");
        }
        console.log(`submitted TxHash:  ${txHash}`);
        break;
      } catch (error) {
        retries++;
        console.log(`error : ${error}`);
      }
    } else {
      retries++;
      console.log(
        `Function ${removeNode.name} failed, error : ${removeNodeUnsigned.error.message}`
      );
    }
  }
}
