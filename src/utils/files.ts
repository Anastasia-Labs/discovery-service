import { mkdir, readFile, writeFile } from "fs/promises";
import isEqual from "lodash/isEqual.js";
// @ts-ignore
import branchName from "current-git-branch";
import { existsSync } from "fs";
import inquirer from "inquirer";
import path from "path";

import { IDynamoTTEntry } from "../@types/db.js";
import {
  IAppliedScriptsJSON,
  IFragmentedUtxosMapJSON,
  IPublishedPolicyJSON,
  ITTConfigJSON,
  ITasteTestVariablesJSON,
  IWallet,
} from "../@types/json.js";
import { getNetwork, isDryRun } from "./args.js";

export const getConfigFilePath = () =>
  path.resolve(process.cwd(), `./generated/${branchName()}/${getNetwork()}`);

export const getTransactionFilesPath = () =>
  `${getConfigFilePath()}/transactions`;

export const getFragmentationTxPath = () =>
  `${getTransactionFilesPath()}/fragmentation.txt`;
export const getFragmentationTx = async () => {
  const path = getFragmentationTxPath();
  if (!existsSync(path)) {
    if (isDryRun()) {
      return undefined;
    }

    throw new Error(
      "A fragmentation transaction hasn't been built yet. Run this command with --dry and then try again.",
    );
  }

  const cbor = await readFile(path, "utf-8");
  return cbor;
};

export const saveFragmentationFileTx = async (cbor: string) => {
  const path = getFragmentationTxPath();

  await mkdir(getTransactionFilesPath(), { recursive: true });
  await writeFile(path, cbor, "utf-8");
};

export const getTokenHolderSubmitTxPath = () =>
  `${getTransactionFilesPath()}/token-holder-submit.txt`;
export const getTokenHolderSubmitTx = async () => {
  const path = getTokenHolderSubmitTxPath();
  if (!existsSync(path)) {
    if (isDryRun()) {
      return undefined;
    }

    throw new Error(
      "A token holder submit transaction hasn't been built yet. Run this command with --dry and then try again.",
    );
  }

  const cbor = await readFile(path, "utf-8");
  return cbor;
};

export const saveTokenHolderSubmitTx = async (cbor: string) => {
  const path = getTokenHolderSubmitTxPath();

  await mkdir(getTransactionFilesPath(), { recursive: true });
  await writeFile(path, cbor, "utf-8");
};

export const getAppliedScriptsPath = () =>
  `${getConfigFilePath()}/applied-scripts.json`;
export const getAppliedScripts = async (): Promise<IAppliedScriptsJSON> => {
  const path = getAppliedScriptsPath();
  const fileContents = await readFile(path, "utf-8");
  if (!existsSync(path)) {
    throw new Error(`Could not find applied scripts at: ${path}`);
  }

  const data: IAppliedScriptsJSON = JSON.parse(fileContents);
  return data;
};

export const saveAppliedScripts = async (
  data: IAppliedScriptsJSON,
  emulator?: boolean,
) => {
  const path = getAppliedScriptsPath();
  if (existsSync(path) && !emulator) {
    const { appliedScriptsOverwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "appliedScriptsOverwrite",
        message: `Applied scripts have already been generated once on this branch. Are you sure you want to overwrite?`,
        default: false,
      },
    ]);

    if (!appliedScriptsOverwrite) {
      console.log("Aborted.");
      return;
    }
  }

  await mkdir(getConfigFilePath(), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Done!`);
};

export const getFragmentedUtxosMapPath = () =>
  `${getConfigFilePath()}/fragmented-utxos-map.json`;
export const getFragmentedUtxosMap =
  async (): Promise<IFragmentedUtxosMapJSON> => {
    const fileContents = await readFile(getFragmentedUtxosMapPath(), {
      encoding: "utf-8",
    });
    const data: IFragmentedUtxosMapJSON = JSON.parse(fileContents);
    return data;
  };

export const saveFragmentedUtxosMapPath = async (
  data: IFragmentedUtxosMapJSON,
  emulator?: boolean,
) => {
  const path = getFragmentedUtxosMapPath();
  if (existsSync(path) && !emulator) {
    if (isDryRun()) {
      return undefined;
    }

    const { fragmentedUtxosMapOverwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "fragmentedUtxosMapOverwrite",
        message: `Fragmented UTxOs have already been generated once on this branch. Are you sure you want to overwrite?`,
        default: false,
      },
    ]);

    if (!fragmentedUtxosMapOverwrite) {
      console.log("Aborted.");
      return;
    }
  }

  await mkdir(getConfigFilePath(), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Done!`);
};

export const getPublishedPolicyOutRefsPath = () =>
  `${getConfigFilePath()}/published-policy.json`;
export const getPublishedPolicyOutRefs =
  async (): Promise<IPublishedPolicyJSON> => {
    const fileContents = await readFile(getPublishedPolicyOutRefsPath(), {
      encoding: "utf-8",
    });
    const data: IPublishedPolicyJSON = JSON.parse(fileContents);
    return data;
  };

export const savePublishedPolicyOutRefs = async (
  data: IPublishedPolicyJSON,
  emulator?: boolean,
) => {
  const path = getPublishedPolicyOutRefsPath();
  if (existsSync(path) && !emulator) {
    if (isDryRun()) {
      return undefined;
    }

    const { publishedPolicyOverwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "publishedPolicyOverwrite",
        message: `A published policy has already been generated once on this branch. Are you sure you want to overwrite?`,
        default: false,
      },
    ]);

    if (!publishedPolicyOverwrite) {
      console.log("Aborted.");
      return;
    }
  }

  await mkdir(getConfigFilePath(), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Done!`);
};

export const getTTVariablesPath = () => `${getConfigFilePath()}/variables.json`;
export const getTTVariables = async (): Promise<ITasteTestVariablesJSON> => {
  const fileContents = await readFile(getTTVariablesPath(), {
    encoding: "utf-8",
  });
  const data: ITasteTestVariablesJSON = JSON.parse(fileContents);
  return data;
};

export const saveTTVariables = async (data: ITasteTestVariablesJSON) => {
  const path = getTTVariablesPath();
  if (existsSync(path)) {
    if (isDryRun()) {
      return undefined;
    }

    const { overwriteTTVariables } = await inquirer.prompt([
      {
        type: "confirm",
        name: "overwriteTTVariables",
        message: `A TT variables file has already been generated once on this branch. Are you sure you want to overwrite?`,
        default: false,
      },
    ]);

    if (!overwriteTTVariables) {
      console.log("Aborted.");
      return;
    }
  }

  await mkdir(getConfigFilePath(), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Done!`);
};

export const updateTTVariables = async (
  values: Partial<ITasteTestVariablesJSON>,
): Promise<true> => {
  const path = getTTVariablesPath();
  const fileContents = await readFile(path, "utf-8");
  const data: ITasteTestVariablesJSON = JSON.parse(fileContents);

  const newData: ITasteTestVariablesJSON = {
    ...data,
    ...values,
  };

  await writeFile(path, JSON.stringify(newData, null, 2), "utf-8");

  const refreshedData = JSON.parse(await readFile(path, "utf-8"));

  if (!isEqual(newData, refreshedData)) {
    throw new Error("Did not update taste test variables!");
  }

  return true;
};

export const getWalletsPath = () => `${getConfigFilePath()}/wallets.json`;
export const getWallets = async (): Promise<IWallet[]> => {
  const path = getWalletsPath();
  if (!existsSync(path)) {
    throw new Error("Could not find the wallets.json file at " + path);
  }

  const file = await readFile(path, "utf-8");
  return JSON.parse(file);
};

export const saveWallets = async (data: IWallet[]) => {
  const path = getWalletsPath();
  if (existsSync(path)) {
    if (isDryRun()) {
      return undefined;
    }

    const { walletOverwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "walletOverwrite",
        message: `Wallets have already been generated once on this branch. Are you sure you want to overwrite?`,
        default: false,
      },
    ]);

    if (!walletOverwrite) {
      console.log("Aborted.");
      return;
    }
  }

  await mkdir(getConfigFilePath(), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Done! Fund this wallet first: ${data[0].address}`);
};

export const getTTConfigPath = () => `${getConfigFilePath()}/config.json`;
export const getTTConfig = async (): Promise<ITTConfigJSON> => {
  const path = getTTConfigPath();
  if (!existsSync(path)) {
    throw new Error(
      "Could not find configuration path. Please run `yarn create-tt` and try again.",
    );
  }

  const data: ITTConfigJSON = JSON.parse(await readFile(path, "utf-8"));
  return data;
};

export const saveConfig = async (config: ITTConfigJSON) => {
  const path = getTTConfigPath();
  const network = getNetwork();

  if (existsSync(path)) {
    const { ttConfigOverwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "ttConfigOverwrite",
        message: `Configuration on the ${network} network for this Taste Test has already been generated once on this branch. Are you sure you want to overwrite?`,
        default: false,
      },
    ]);

    if (!ttConfigOverwrite) {
      console.log("Aborted.");
      return;
    }
  }

  await mkdir(getConfigFilePath(), { recursive: true });
  await writeFile(path, JSON.stringify(config, null, 2), "utf-8");
  console.log(`Saved template to ${path}. Please update with real values!`);
};

export const getFundWalletsTxPath = () =>
  `${getTransactionFilesPath()}/fundWallets.txt`;
export const getFundWalletsTx = async () => {
  const path = getFundWalletsTxPath();
  if (!existsSync(path)) {
    throw new Error(
      `Could not find fundWallets.txt at ${path}. Please run "yarn fund-wallets --dry", and then try again.`,
    );
  }

  return await readFile(path, "utf-8");
};

export const saveFundWalletsTx = async (cbor: string) => {
  const path = getFundWalletsTxPath();
  if (existsSync(path)) {
    const { fundWalletsOverride } = await inquirer.prompt([
      {
        type: "confirm",
        name: "fundWalletsOverride",
        message: `A fundWallets transaction has already been generated once on this branch. Are you sure you want to overwrite?`,
        default: false,
      },
    ]);

    if (!fundWalletsOverride) {
      console.log("Aborted.");
      return;
    }
  }

  await mkdir(getTransactionFilesPath(), { recursive: true });
  await writeFile(path, cbor, "utf-8");
  console.log(`Done! -->`, `"${cbor}"`);
};

export const getMintTokenTxPath = () =>
  `${getTransactionFilesPath()}/mintToken.txt`;
export const getMintTokenTx = async () => {
  const path = getMintTokenTxPath();
  if (!existsSync(path)) {
    throw new Error(
      `Could not find mintToken.txt at ${path}. Please run "yarn mint-token --dry", and then try again.`,
    );
  }

  return await readFile(path, "utf-8");
};

export const saveMintTokenTx = async (cbor: string, emulator?: boolean) => {
  const path = getMintTokenTxPath();
  if (existsSync(path) && !emulator) {
    const { mintTokenOverride } = await inquirer.prompt([
      {
        type: "confirm",
        name: "mintTokenOverride",
        message: `A mintToken transaction has already been generated once on this branch. Are you sure you want to overwrite?`,
        default: false,
      },
    ]);

    if (!mintTokenOverride) {
      console.log("Aborted.");
      return;
    }
  }

  await mkdir(getTransactionFilesPath(), { recursive: true });
  await writeFile(path, cbor, "utf-8");
  if (!emulator) {
    console.log(cbor);
  }
};

export const getFragmentWalletTxPath = () =>
  `${getTransactionFilesPath()}/fragmentWallet.txt`;
export const getFragmentWalletTx = async () => {
  const path = getFragmentWalletTxPath();
  if (!existsSync(path)) {
    if (isDryRun()) {
      return undefined;
    }

    throw new Error(
      `Could not find fragmentWallet.txt. Please run "yarn fragment-publish-wallet --dry", and then try again.`,
    );
  }

  return await readFile(path, "utf-8");
};

export const saveFragmentWalletTx = async (
  cbor: string,
  emulator?: boolean,
) => {
  const path = getFragmentWalletTxPath();
  if (existsSync(path) && !emulator) {
    const { fragmentWalletOverride } = await inquirer.prompt([
      {
        type: "confirm",
        name: "fragmentWalletOverride",
        message: `A fragmentWallet transaction has already been generated once on this branch. Are you sure you want to overwrite?`,
        default: false,
      },
    ]);

    if (!fragmentWalletOverride) {
      console.log("Aborted.");
      return;
    }
  }

  await mkdir(getTransactionFilesPath(), { recursive: true });
  await writeFile(path, cbor, "utf-8");
  if (!emulator) {
    console.log(cbor);
  }
};

export const getPublishScriptTxPath = (index: number) =>
  `${getTransactionFilesPath()}/publishScript-${index}.txt`;
export const getPublishScriptTx = async (index: number) => {
  const path = getPublishScriptTxPath(index);
  if (!existsSync(path)) {
    if (isDryRun()) {
      return undefined;
    }

    throw new Error(
      `Could not find publishScript-${index}.txt. Please run "yarn publish-scripts --dry", and then try again.`,
    );
  }

  return await readFile(path, "utf-8");
};

export const savePublishScriptTx = async (
  cbor: string,
  index: number,
  emulator?: boolean,
) => {
  const path = getPublishScriptTxPath(index);
  if (existsSync(path) && !emulator) {
    const { publishScriptOverwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "publishScriptOverwrite",
        message: `A publishScript-${index} transaction has already been generated once on this branch. Are you sure you want to overwrite?`,
        default: false,
      },
    ]);

    if (!publishScriptOverwrite) {
      console.log("Aborted.");
      return;
    }
  }

  await mkdir(getTransactionFilesPath(), { recursive: true });
  await writeFile(path, cbor, "utf-8");
  if (!emulator) {
    console.log(cbor);
  }
};

export const getInitTokenHolderTxPath = () =>
  `${getTransactionFilesPath()}/initTokenHolder.txt`;
export const getInitTokenHolderTx = async () => {
  const path = getInitTokenHolderTxPath();
  if (!existsSync(path)) {
    if (isDryRun()) {
      return undefined;
    }

    throw new Error(
      `Could not find initTokenHolder.txt. Please run "yarn init-token-holder --dry", and then try again.`,
    );
  }

  return await readFile(path, "utf-8");
};

export const saveInitTokenHolderTx = async (
  cbor: string,
  emulator?: boolean,
) => {
  const path = getInitTokenHolderTxPath();
  if (existsSync(path) && !emulator) {
    const { initTokenHolderOverwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "initTokenHolderOverwrite",
        message: `An initTokenHolder transaction has already been generated once on this branch. Are you sure you want to overwrite?`,
        default: false,
      },
    ]);

    if (!initTokenHolderOverwrite) {
      console.log("Aborted.");
      return;
    }
  }

  await mkdir(getTransactionFilesPath(), { recursive: true });
  await writeFile(path, cbor, "utf-8");
  if (!emulator) {
    console.log(cbor);
  }
};

export const getRegisterStakeTxPath = () =>
  `${getTransactionFilesPath()}/registerStake.txt`;
export const getRegisterStakeTx = async () => {
  const path = getRegisterStakeTxPath();
  if (!existsSync(path)) {
    if (isDryRun()) {
      return undefined;
    }

    throw new Error(
      `Could not find registerStake.txt. Please run "yarn register-stake --dry", and then try again.`,
    );
  }

  return await readFile(path, "utf-8");
};

export const saveRegisterStakeTx = async (cbor: string, emulator?: boolean) => {
  const path = getRegisterStakeTxPath();
  if (existsSync(path) && !emulator) {
    const { registerStakeOverwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "registerStakeOverwrite",
        message: `An registerStake transaction has already been generated once on this branch. Are you sure you want to overwrite?`,
        default: false,
      },
    ]);

    if (!registerStakeOverwrite) {
      console.log("Aborted.");
      return;
    }
  }

  await mkdir(getTransactionFilesPath(), { recursive: true });
  await writeFile(path, cbor, "utf-8");
  if (!emulator) {
    console.log(cbor);
  }
};

export const getInitTTTxPath = () =>
  `${getTransactionFilesPath()}/initTasteTest.txt`;
export const getInitTTTx = async () => {
  const path = getInitTTTxPath();
  if (!existsSync(path)) {
    if (isDryRun()) {
      return undefined;
    }

    throw new Error(
      `Could not find initTasteTest.txt. Please run "yarn start-tt --dry", and then try again.`,
    );
  }

  return await readFile(path, "utf-8");
};

export const saveInitTTTx = async (cbor: string, emulator?: boolean) => {
  const path = getInitTTTxPath();
  if (existsSync(path) && !emulator) {
    const { initTTOverwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "initTTOverwrite",
        message: `An initTT transaction has already been generated once on this branch. Are you sure you want to overwrite?`,
        default: false,
      },
    ]);

    if (!initTTOverwrite) {
      console.log("Aborted.");
      return;
    }
  }

  await mkdir(getTransactionFilesPath(), { recursive: true });
  await writeFile(path, cbor, "utf-8");
  if (!emulator) {
    console.log(cbor);
  }
};

export const getDynamoDBPath = () => `${getConfigFilePath()}/dynamo-db.json`;
export const saveDynamoDB = async (data: IDynamoTTEntry) => {
  const path = getDynamoDBPath();
  if (existsSync(path)) {
    const { dynamoDBOverwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "dynamoDBOverwrite",
        message: `A DynamoDB table has already been generated once on this branch. Are you sure you want to overwrite?`,
        default: false,
      },
    ]);

    if (!dynamoDBOverwrite) {
      console.log("Aborted.");
      return;
    }
  }

  await mkdir(getConfigFilePath(), { recursive: true });
  await writeFile(path, JSON.stringify(data, null, 2), "utf-8");
  console.log(`Done!`);
};
