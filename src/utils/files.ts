import { readFile, writeFile } from "fs/promises";
import isEqual from "lodash/isEqual.js";

import appliedSchema from "../../applied-scripts.json" assert { type: "json" };
import deployUtxoMapSchema from "../../deploy-utxo-map.json" assert { type: "json" };
import deployedSchema from "../../deployed-policy.json" assert { type: "json" };
import ttVariablesSchema from "../../taste-test-variables.json" assert { type: "json" };
import tokenHolderSubmitSchema from "../../token-holder-submit.json" assert { type: "json" };

export const getTokenHolderSubmitTx = async (): Promise<
  typeof tokenHolderSubmitSchema
> => {
  const fileContents = await readFile(`./token-holder-submit.json`, {
    encoding: "utf-8",
  });
  const data = JSON.parse(fileContents);
  return data;
};

export const getAppliedScripts = async (): Promise<typeof appliedSchema> => {
  const fileContents = await readFile(`./applied-scripts.json`, {
    encoding: "utf-8",
  });
  const data = JSON.parse(fileContents);
  return data;
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
