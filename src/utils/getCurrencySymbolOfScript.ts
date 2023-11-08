import { setTimeout } from "timers/promises";
import dotenv from "dotenv";
dotenv.config();
import {
  Blockfrost,
  fromText,
  insertNode,
  InsertNodeConfig,
  Lucid,
  MintingPolicy,
  Network,
  toUnit,
  utxosAtScript,
} from "price-discovery-offchain";
import wallets from "../../test/wallets.json" assert { type: "json" };
import applied from "../../applied-scripts.json" assert { type: "json" };
import {
  signSubmitValidate,
} from "./misc.js";

const lucid = await Lucid.new(
  new Blockfrost(process.env.API_URL!, process.env.API_KEY),
  process.env.NETWORK as Network
);

const nodePolicy: MintingPolicy = {
    type: "PlutusV2",
    script: applied.scripts.discoveryPolicy,
  };

  const nodePolicyId = lucid.utils.mintingPolicyToId(nodePolicy);

const originNodeTokenName = fromText("FSN");
console.log(toUnit(nodePolicyId, originNodeTokenName))
