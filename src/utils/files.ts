import { readFile } from "fs/promises";
import appliedSchema from "../../applied-scripts.json" assert { type: "json" };
import deployedSchema from "../../deployed-policy.json" assert { type: "json" };

export const getAppliedScripts = async (): Promise<typeof appliedSchema> => {
  const fileContents = await readFile(`./applied-scripts.json`, {
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
