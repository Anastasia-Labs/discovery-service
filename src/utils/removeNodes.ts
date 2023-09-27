import { setTimeout } from "timers/promises";
import dotenv from "dotenv";
dotenv.config();
import {
  Blockfrost,
  Lucid,
  Network,
  removeNode,
  RemoveNodeConfig,
  utxosAtScript,
} from "price-discovery-offchain";
import wallets from "../../test/wallets.json" assert { type: "json" };
import applied from "../../applied-scripts.json" assert { type: "json" };
import refScripts from "../../deployed-policy.json" assert { type: "json" };
import {
  signSubmitValidate,
} from "./misc.js";

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

  let retries = 0;
  while (retries < maxRetries) {
    // offset wallet & blockchain sync
    await setTimeout(5_000);
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
    const isValid = await signSubmitValidate(lucid, removeNodeUnsigned);
    if (isValid) break;
    retries++;
  }
}
