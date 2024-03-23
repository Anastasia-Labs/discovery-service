import dotenv from "dotenv";
import {
  Blockfrost,
  insertNode,
  InsertNodeConfig,
  Lucid,
  Network,
  utxosAtScript,
} from "price-discovery-offchain";
import { setTimeout } from "timers/promises";
import applied from "../../applied-scripts.json" assert { type: "json" };
import refScripts from "../../deployed-policy.json" assert { type: "json" };
import wallets from "../../test/wallets.json" assert { type: "json" };
import { signSubmitValidate } from "./misc.js";
dotenv.config();

const lucid = await Lucid.new(
  new Blockfrost(process.env.API_URL!, process.env.API_KEY),
  process.env.NETWORK as Network,
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

    console.log(`\n selecting Wallet ${index} , address: ${wallet.address}`);
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
      amountLovelace: 3_000_000,
    };

    const insertNodeUnsigned = await insertNode(lucid, insertNodeConfig);
    const isValid = await signSubmitValidate(lucid, insertNodeUnsigned);
    if (isValid) break;
    retries++;
  }
}
