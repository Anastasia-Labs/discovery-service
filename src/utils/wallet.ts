import "./env.js";

import { Blockfrost, Lucid } from "price-discovery-offchain";

import { readFile, writeFile } from "fs/promises";
import inquirer from "inquirer";
import { EmulatorAccount } from "../@types/blockfrost.js";
import { MAINNET_OFFSET, PREVIEW_OFFSET } from "../constants/network.js";
import {
  MAX_WALLET_GROUP_COUNT,
  MIN_ADA_INSERT_WALLET,
} from "../constants/utils.js";
import { getNetwork } from "./args.js";
import {
  getAppliedScripts,
  getConfigFilePath,
  getPublishedPolicyOutRefs,
  getTTConfig,
  getWallets,
} from "./files.js";

let lucidInstance: Lucid;

export const getNewBlockfrostInstance = async () => {
  return new Blockfrost(process.env.API_URL!, process.env.API_KEY!);
};

export const getLucidInstance = async () => {
  if (!lucidInstance) {
    const network = getNetwork();
    lucidInstance = await Lucid.new(
      await getNewBlockfrostInstance(),
      network === "mainnet" ? "Mainnet" : "Preview",
    );
  }

  return lucidInstance;
};

export const selectLucidWallet = async (lucid: Lucid, index: number) => {
  const wallets = await getWallets();
  lucid.selectWalletFromSeed(wallets[index].seed as string);

  return lucid;
};

export const fetchFromBlockfrost = async (slug: string) => {
  return fetch(`${process.env.API_URL}/${slug}`, {
    method: "GET",
    headers: {
      project_id: process.env.API_KEY as string,
    },
  })
    .then((res) => res.json())
    .catch((e) => console.log(e));
};

export const posixToSlot = (timestamp: number | string) =>
  Math.floor(
    Math.trunc(Math.floor(Number(timestamp) / 1000)) -
      (getNetwork() === "mainnet"
        ? Number(MAINNET_OFFSET)
        : Number(PREVIEW_OFFSET)),
  );

export const slotToPosix = (slot: number | string) =>
  Math.floor(
    Math.trunc(Math.floor(Number(slot) * 1000)) +
      (getNetwork() === "mainnet"
        ? Number(MAINNET_OFFSET)
        : Number(PREVIEW_OFFSET)),
  );

export const getEmulatorLedger = async (
  lucid: Lucid,
): Promise<EmulatorAccount[]> => {
  const {
    project: { addresses },
    v1PoolData,
  } = await getTTConfig();
  const wallets = await getWallets();
  const applied = await getAppliedScripts();
  const deployed = await getPublishedPolicyOutRefs();
  const snapshotSlug = `${getConfigFilePath()}/blockfrost-ledger.json`;

  const restAccounts: EmulatorAccount[] = [...wallets]
    .slice(0, MAX_WALLET_GROUP_COUNT)
    .map(({ address }) => ({
      address,
      assets: {
        lovelace: MIN_ADA_INSERT_WALLET,
      },
    }));

  const { regenerate } = await inquirer.prompt([
    {
      type: "confirm",
      name: "regenerate",
      message: "Regenerate ledger from Blockfrost (this can take some time)?",
      default: false,
    },
  ]);

  if (regenerate) {
    console.log("Fetching from " + process.env.NODE_ENV);
    const utxos: EmulatorAccount[] = await Promise.all([
      lucid.provider.getUtxos(addresses.liquidityDestination),
      lucid.provider.getUtxos(addresses.withdrawPenalty),
      lucid.provider.getUtxos(addresses.publishScripts),
      lucid.provider.getUtxos(v1PoolData.address),
      lucid.provider
        .getUtxoByUnit(v1PoolData.factoryToken.replace(".", ""))
        .then(async (res) => {
          const datum = await lucid.provider.getDatum(res.datumHash as string);

          // Replace the datum hash with the real inline datum.
          return [
            {
              ...res,
              datumHash: undefined,
              datum,
            },
          ];
        }),
      lucid.provider.getUtxosByOutRef([applied.discoveryPolicy.initOutRef]),
      lucid.provider.getUtxosByOutRef([applied.projectTokenHolder.initOutRef]),
      ...restAccounts.map(({ address }) => lucid.provider.getUtxos(address)),
      ...Object.values(deployed.scriptsRef).map(async (outRef) =>
        lucid.provider.getUtxosByOutRef([outRef]),
      ),
      ...Object.entries(applied.scripts).map(async ([key, script]) =>
        lucid.provider.getUtxos(
          lucid.utils.validatorToAddress({
            type: key === "proxyTokenHolderValidator" ? "PlutusV1" : "PlutusV2",
            script,
          }),
        ),
      ),
    ]).then((res) =>
      res.flatMap((d) =>
        d.map((utxo) => {
          return {
            txHash: utxo.txHash,
            txIndex: utxo.outputIndex.toString(),
            address: utxo.address,
            assets: utxo.assets,
            outputData: {
              hash: utxo.datumHash ?? undefined,
              inline: utxo.datum ?? undefined,
              scriptRef: utxo.scriptRef ?? undefined,
            },
          };
        }),
      ),
    );

    await writeFile(
      snapshotSlug,
      JSON.stringify(utxos, (_, v) => (typeof v === "bigint" ? `${v}n` : v), 2),
      "utf-8",
    );
    console.log("Done!");
  }

  const utxos: EmulatorAccount[] = JSON.parse(
    await readFile(snapshotSlug, "utf-8"),
    (_, v) =>
      typeof v === "string" && v.indexOf("n") === v.length - 1
        ? BigInt(v.replace("n", ""))
        : v,
  );

  return utxos;
};
