import { mkdir, readFile, writeFile } from "fs/promises";
import isEqual from "lodash/isEqual.js";
// @ts-ignore
import branchName from "current-git-branch";

import { existsSync } from "fs";
import inquirer from "inquirer";
import path from "path";
import deployUtxoMapSchema from "../../deploy-utxo-map.json" assert { type: "json" };
import deployedSchema from "../../deployed-policy.json" assert { type: "json" };
import ttVariablesSchema from "../../taste-test-variables.json" assert { type: "json" };
import tokenHolderSubmitSchema from "../../token-holder-submit.json" assert { type: "json" };
import { ITTConfigJSON } from "../@types/config.js";
import { IAppliedScriptsJSON, IWallet } from "../@types/files.js";
import { getNetwork, isDryRun } from "./args.js";

export const getConfigFilePath = () =>
  path.resolve(process.cwd(), `./generated/${branchName()}/`);

export const getTransactionFilesPath = () =>
  `${getConfigFilePath()}/transactions/${getNetwork()}`;

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

  await mkdir(path);
  await writeFile(path, cbor, "utf-8");
};

export const getTokenHolderSubmitTx = async (): Promise<
  typeof tokenHolderSubmitSchema
> => {
  const fileContents = await readFile(`./token-holder-submit.json`, {
    encoding: "utf-8",
  });
  const data = JSON.parse(fileContents);
  return data;
};

export const getAppliedScriptsPath = () =>
  `${getConfigFilePath()}/applied-scripts.${getNetwork()}.json`;
export const getAppliedScripts = async (): Promise<IAppliedScriptsJSON> => {
  const fileContents = await readFile(getAppliedScriptsPath(), "utf-8");
  const data: IAppliedScriptsJSON = JSON.parse(fileContents);
  return data;
};
export const saveAppliedScripts = async (data: IAppliedScriptsJSON) => {
  const path = getAppliedScriptsPath();
  if (existsSync(path)) {
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

export const getDeployUtxoMap = async (): Promise<
  typeof deployUtxoMapSchema
> => {
  const fileContents = await readFile(`./deploy-utxo-map.json`, {
    encoding: "utf-8",
  });
  const data = JSON.parse(fileContents);
  return data;
};

export const getDeployedScripts = async (): Promise<typeof deployedSchema> => {
  const fileContents = await readFile(`./deployed-policy.json`, {
    encoding: "utf-8",
  });
  const data = JSON.parse(fileContents);
  return data;
};

export const getTasteTestVariables = async (): Promise<
  typeof ttVariablesSchema
> => {
  const fileContents = await readFile(`./taste-test-variables.json`, {
    encoding: "utf-8",
  });
  const data = JSON.parse(fileContents);
  return data;
};

export const updateTasteTestVariables = async (
  values: Partial<typeof ttVariablesSchema>,
): Promise<true> => {
  const fileContents = await readFile(`./taste-test-variables.json`, "utf-8");
  const data = JSON.parse(fileContents);

  const newData: typeof ttVariablesSchema = {
    ...data,
    ...values,
  };

  await writeFile(
    `./taste-test-variables.json`,
    JSON.stringify(newData, null, 2),
    "utf-8",
  );

  const refreshedData = JSON.parse(
    await readFile(`./taste-test-variables.json`, "utf-8"),
  );

  if (!isEqual(newData, refreshedData)) {
    throw new Error("Did not update taste test variable!");
  }

  return true;
};

export const getWalletsPath = () =>
  `${getConfigFilePath()}/wallets.${getNetwork()}.json`;
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

export const getTTConfigPath = () =>
  `${getConfigFilePath()}/config.${getNetwork()}.json`;
export const getConfig = async (): Promise<ITTConfigJSON> => {
  const path = getTTConfigPath();
  if (!existsSync(path)) {
    throw new Error(
      "Could not find configuration path. Please run `yarn setup-config` and try again.",
    );
  }

  const data = await readFile(path, "utf-8");

  return JSON.parse(data) as ITTConfigJSON;
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
