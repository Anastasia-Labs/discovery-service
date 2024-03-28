import { Assets, Emulator, Lucid, OutputData } from "price-discovery-offchain";
import { setTimeout } from "timers/promises";
import "./env.js";

import { readFile, writeFile } from "fs/promises";
import inquirer from "inquirer";
import wallets from "../../test/wallets.json" assert { type: "json" };
import {
  MAX_WALLET_GROUP_COUNT,
  MIN_ADA_INSERT_WALLET,
} from "../constants/utils.js";
import { buildLiquidityScriptsAction } from "../service/liquidity/buildLiquidityScriptsAction.js";
import { claimLiquidityNodeAction } from "../service/liquidity/claimLiquidityNodeAction.js";
import { createV1PoolAction } from "../service/liquidity/createV1PoolAction.js";
import { deployLiquidityScriptsAction } from "../service/liquidity/deployLiquidityScriptsAction.js";
import { foldLiquidityNodesAction } from "../service/liquidity/foldLiquidityNodesAction.js";
import { foldLiquidityRewardsAction } from "../service/liquidity/foldLiquidityRewardsAction.js";
import { initLiquidityFoldServiceAction } from "../service/liquidity/initLiquidityFoldServiceAction.js";
import { initLiquidityRewardServiceAction } from "../service/liquidity/initLiquidityRewardServiceAction.js";
import { initTokenHolderAction } from "../service/liquidity/initTokenHolderAction.js";
import { initializeLiquidityAction } from "../service/liquidity/initializeLiquidityAction.js";
import { insertLiquidityNodesAction } from "../service/liquidity/insertLiquidityNodesAction.js";
import { liquidityAddCollectedAction } from "../service/liquidity/liquidityAddCollectedAction.js";
import { modifyLiquidityNodesAction } from "../service/liquidity/modifyLiquidityNodesAction.js";
import { removeLiquidityNodeAction } from "../service/liquidity/removeLiquidityNodeAction.js";
import { spendToProxyAction } from "../service/liquidity/spendToProxyAction.js";
import { startTasteTest } from "../service/startTasteTestAction.js";
import {
  getAppliedScripts,
  getDeployedScripts,
  getTokenHolderSubmitTx,
} from "./files.js";
import { getLucidInstance, selectLucidWallet } from "./wallet.js";

interface EmulatorAccount {
  address: string;
  assets: Assets;
  txHash?: string;
  txIndex?: string;
  outputData?: OutputData | undefined;
}

const snapshotSlug = `./generated/${process.env.NODE_ENV}-snapshot.json`;

const saveSnapshot = async (restAccounts: EmulatorAccount[]) => {
  const lucidInstance = await getLucidInstance();
  const applied = await getAppliedScripts();
  const deployed = await getDeployedScripts();
  const utxos: EmulatorAccount[] = await Promise.all([
    lucidInstance.provider.getUtxos(process.env.PROJECT_ADDRESS!),
    lucidInstance.provider.getUtxos(process.env.PENALTY_ADDRESS!),
    lucidInstance.provider.getUtxos(process.env.REF_SCRIPTS_ADDRESS!),
    lucidInstance.provider.getUtxos(process.env.POOL_ADDRESS!),
    lucidInstance.provider.getUtxosByOutRef([
      applied.discoveryPolicy.initOutRef,
    ]),
    lucidInstance.provider.getUtxosByOutRef([
      applied.projectTokenHolder.initOutRef,
    ]),
    ...restAccounts.map(({ address }) =>
      lucidInstance.provider.getUtxos(address),
    ),
    ...Object.values(deployed.scriptsRef).map(async (outRef) =>
      lucidInstance.provider.getUtxosByOutRef([outRef]),
    ),
    ...Object.entries(applied.scripts).map(async ([key, script]) =>
      lucidInstance.provider.getUtxos(
        lucidInstance.utils.validatorToAddress({
          type: key === "proxyTokenHolderValidator" ? "PlutusV1" : "PlutusV2",
          script,
        }),
      ),
    ),
  ]).then((res) =>
    res.flatMap((d) =>
      d.map((utxo) => ({
        txHash: utxo.txHash,
        txIndex: utxo.outputIndex.toString(),
        address: utxo.address,
        assets: utxo.assets,
        outputData: {
          hash: utxo.datumHash ?? undefined,
          inline: utxo.datum ?? undefined,
        },
      })),
    ),
  );

  await writeFile(
    snapshotSlug,
    JSON.stringify(utxos, (_, v) => (typeof v === "bigint" ? `${v}n` : v), 2),
    "utf-8",
  );
};

const emulateLiquidity = async () => {
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
    await saveSnapshot(restAccounts);
    console.log("Done!");
  }

  const utxos: EmulatorAccount[] = JSON.parse(
    await readFile(snapshotSlug, "utf-8"),
    (_, v) =>
      typeof v === "string" && v.indexOf("n") === v.length - 1
        ? BigInt(v.replace("n", ""))
        : v,
  );
  const emulator = new Emulator(utxos);
  // const deadline = emulator.now() + EMULATOR_TT_END_DELAY;
  const deadline = Number(process.env.DEADLINE!);
  const network = process.env.NODE_ENV?.includes("mainnet")
    ? "Mainnet"
    : "Preview";
  const lucidInstance = await Lucid.new(emulator, network);
  const DELAY = 0;

  try {
    // console.log("\n\n\nEMULATOR: Minting Project Token...");
    // await mintNFTAction(lucidInstance);
    // console.log("Moving to next step...");
    // await setTimeout(DELAY);
    if (false) {
      console.log("\n\n\nEMULATOR: Building Liquidity Scripts...");
      await buildLiquidityScriptsAction(lucidInstance, deadline);
      console.log("Moving to next step...");
      await setTimeout(DELAY);

      console.log("\n\n\nEMULATOR: Deploying Liquidity Scripts...");
      await deployLiquidityScriptsAction(lucidInstance, emulator);
      console.log("Moving to next step...");
      await setTimeout(DELAY);

      console.log("\n\n\nEMULATOR: Initializing Token Holder...");
      await initTokenHolderAction(lucidInstance);
      const thSubmit = await getTokenHolderSubmitTx();
      await selectLucidWallet(lucidInstance, 0);
      const txSigned = await lucidInstance
        .fromTx(thSubmit.cbor)
        .sign()
        .complete();
      const txHash = await txSigned.submit();
      await lucidInstance.awaitTx(txHash);
      console.log("Moving to next step...");
      await setTimeout(DELAY);

      console.log("\n\n\nEMULATOR: Initializing Liquidity TT...");
      await initializeLiquidityAction(lucidInstance);
      console.log("Moving to next step...");
      await setTimeout(DELAY);

      console.log("\n\n\nEMULATOR: Starting Taste Test...");
      await startTasteTest(lucidInstance);
      console.log("Moving to next step...");
      await setTimeout(DELAY);

      console.log("\n\n\nEMULATOR: Depositing to Taste Test...");
      await insertLiquidityNodesAction(lucidInstance, emulator);
      console.log("Moving to next step...");
      await setTimeout(DELAY);

      console.log("\n\n\nEMULATOR: Modifying Deposits...");
      await modifyLiquidityNodesAction(lucidInstance, emulator);
      console.log("Moving to next step...");
      await setTimeout(DELAY);

      console.log("\n\n\nEMULATOR: Removing Some Deposits with Penalty...");
      await removeLiquidityNodeAction(lucidInstance, emulator, deadline);
      console.log("Moving to next step...");
      await setTimeout(DELAY);
    }

    console.log("\n\n\nEMULATOR: Initializing Fold UTXO...");
    console.log(emulator.now());
    emulator.awaitSlot(120780909 + 1000);
    // emulator.awaitBlock(EMULATOR_TT_BLOCK_DURATION); // Ensure TT is done.
    await initLiquidityFoldServiceAction(lucidInstance, emulator);
    console.log("Moving to next step...");
    await setTimeout(DELAY);

    console.log("\n\n\nEMULATOR: Fold Liquidity Nodes...");
    await foldLiquidityNodesAction(lucidInstance, emulator);
    console.log("Moving to next step...");
    await setTimeout(DELAY);

    if (false) {
      console.log("\n\n\nEMULATOR: Adding Liquidity to Token Holder...");
      await liquidityAddCollectedAction(lucidInstance, emulator);
      console.log("Moving to next step...");
      await setTimeout(DELAY);

      console.log("\n\n\nEMULATOR: Spending to Proxy Token Holder...");
      await spendToProxyAction(lucidInstance, emulator);
      console.log("Moving to next step...");
      await setTimeout(DELAY);

      console.log("\n\n\nEMULATOR: Creating V1 Pool...");
      await createV1PoolAction(lucidInstance, emulator);
      console.log("Moving to next step...");
      await setTimeout(DELAY);

      console.log("\n\n\nEMULATOR: Initializing Reward Fold...");
      await initLiquidityRewardServiceAction(lucidInstance, emulator);
      console.log("Moving to next step...");
      await setTimeout(DELAY);

      console.log("\n\n\nEMULATOR: Distributing Rewards...");
      await foldLiquidityRewardsAction(lucidInstance, emulator);
      console.log("Moving to next step...");
      await setTimeout(DELAY);

      console.log("\n\n\nEMULATOR: Claiming a Reward...");
      await claimLiquidityNodeAction(lucidInstance, emulator);
      await setTimeout(DELAY);
    }
  } catch (e) {
    console.log("Something went wrong. Error:", e);
    return;
  }

  console.log(`
    \x1b[32m
        You Did It! You are the
        
    ██████╗  ██████╗ ███████╗███████╗
    ██╔══██╗██╔═══██╗██╔════╝██╔════╝
    ██████╔╝██║   ██║███████╗███████╗
    ██╔══██╗██║   ██║╚════██║╚════██║
    ██████╔╝╚██████╔╝███████║███████║
    ╚═════╝  ╚═════╝ ╚══════╝╚══════╝
    \x1b[0m
    `);
};

emulateLiquidity();
