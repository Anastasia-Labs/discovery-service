import { mkdir, readFile, writeFile } from "fs/promises";
import isEqual from "lodash/isEqual.js";
// @ts-ignore
import branchName from "current-git-branch";
import { existsSync } from "fs";
import inquirer from "inquirer";
import path from "path";

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

export const getFragmentationTransactionPath = () =>
  `${getTransactionFilesPath()}/fragmentation.txt`;
export const getFragmentationTransaction = async () => {
  const path = getFragmentationTransactionPath();
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

export const saveFragmentationFileTransaction = async (cbor: string) => {
  const path = getFragmentationTransactionPath();

  await mkdir(getConfigFilePath(), { recursive: true });
  await writeFile(path, cbor, "utf-8");
};

export const getTokenHolderSubmitTransactionPath = () =>
  `${getConfigFilePath()}/token-holder-submit.txt`;
export const getTokenHolderSubmitTransaction = async () => {
  const path = getTokenHolderSubmitTransactionPath();
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

export const saveTokenHolderSubmitTransaction = async (cbor: string) => {
  const path = getTokenHolderSubmitTransactionPath();

  await mkdir(getConfigFilePath(), { recursive: true });
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

export const saveAppliedScripts = async (data: IAppliedScriptsJSON) => {
  const path = getAppliedScriptsPath();
  if (existsSync(path)) {
    if (isDryRun()) {
      return undefined;
    }

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
) => {
  const path = getAppliedScriptsPath();
  if (existsSync(path)) {
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
) => {
  const path = getPublishedPolicyOutRefsPath();
  if (existsSync(path)) {
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

export const getTTVariablesPath = () =>
  `${getConfigFilePath()}/tt-variables.json`;
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
    throw new Error("Did not update taste test variable!");
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
  `${getConfigFilePath()}/fundWallets.txt`;
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

  await mkdir(getConfigFilePath(), { recursive: true });
  await writeFile(path, cbor, "utf-8");
  console.log(`Done!`, `"${cbor}"`);
};

export const getMintTokenTxPath = () => `${getConfigFilePath()}/mintToken.txt`;
export const getMintTokenTx = async () => {
  const path = getMintTokenTxPath();
  if (!existsSync(path)) {
    throw new Error(
      `Could not find mintToken.txt at ${path}. Please run "yarn mint-token --dry", and then try again.`,
    );
  }

  return await readFile(path, "utf-8");
};

export const saveMintTokenTx = async (cbor: string) => {
  const path = getMintTokenTxPath();
  if (existsSync(path)) {
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

  await mkdir(getConfigFilePath(), { recursive: true });
  await writeFile(path, cbor, "utf-8");
  console.log(`Done!`, `"${cbor}"`);
};
