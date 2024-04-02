import { Lucid } from "price-discovery-offchain";
import "../../utils/env.js";

import { ITTConfigJSON } from "../../@types/config.js";
import { saveConfig } from "../../utils/files.js";

export const createTasteTestAction = async (lucid: Lucid) => {
  const data: ITTConfigJSON = {
    blockfrost: {
      apiKey: process.env.API_KEY!,
      endpoint: process.env.API_URL!,
    },
    deadline: 0,
    project: {
      addresses: {
        cleanupRefund: "",
        liquidityDestination: "",
        tokenHolder: "",
        withdrawPenalty: "",
      },
      description: "",
      name: "",
      token: {
        decimals: 6,
        readableName: "Example Token Name",
        suppliedAmount: 0,
      },
    },
    scriptType: "optimized",
    v1PoolData: {
      address: "",
      factoryToken: "",
      policyId: "",
      policyScriptBytes: "",
      validatorScriptBytes: "",
    },
  };

  await saveConfig(data);
};
