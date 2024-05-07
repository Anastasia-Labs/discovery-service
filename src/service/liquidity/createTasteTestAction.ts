import { Emulator } from "price-discovery-offchain";
import { ITTConfigJSON, ITasteTestVariablesJSON } from "../../@types/json.js";
import {
  EMULATOR_TT_END_DELAY,
  MAINNET_PUBLISH_SCRIPT_ADDRESS,
} from "../../constants/utils.js";
import { getNetwork } from "../../utils/args.js";
import "../../utils/env.js";
import { getWallets, saveConfig, saveTTVariables } from "../../utils/files.js";

export const createTasteTestAction = async (emulator?: Emulator) => {
  const network = getNetwork();
  const wallets = await getWallets();

  const deadline = emulator
    ? emulator.now() + EMULATOR_TT_END_DELAY
    : Date.now() + 1000 * 60 * 60 * 2; // Defaults to 2 hours

  const data: ITTConfigJSON = {
    startDate: 0, // placeholder
    endDate: deadline,
    project: {
      addresses: {
        cleanupRefund:
          emulator || network === "preview"
            ? wallets[0].address
            : MAINNET_PUBLISH_SCRIPT_ADDRESS,
        liquidityDestination: wallets[0].address,
        tokenHolder: wallets[1].address,
        withdrawPenalty: wallets[0].address,
        publishScripts: wallets[2].address,
      },
      description: emulator ? "Emulator project description." : "",
      name: emulator ? "Emulator Taste Test" : "",
      token: {
        decimals: 6,
        readableName: "Example Token Name",
        suppliedAmount: emulator ? 1000000000 : 0,
      },
    },
    scriptType: "optimized",
    v1PoolData: {
      address: process.env.POOL_ADDRESS!,
      factoryToken: process.env.POOL_FACTORY_TOKEN!,
      policyId: process.env.POOL_POLICY_ID!,
      policyScriptBytes: process.env.POOL_POLICY_SCRIPT!,
      validatorScriptBytes: process.env.POOL_VALIDATOR_SCRIPT!,
    },
  };

  const tasteTestVariables: ITasteTestVariablesJSON = {
    lpTokenAssetName: "",
    projectTokenAssetName: Buffer.from(
      data.project.token.readableName,
    ).toString("hex"),
    projectTokenPolicyId: "",
  };

  await saveTTVariables(tasteTestVariables, Boolean(emulator));
  await saveConfig(data, Boolean(emulator));
};
