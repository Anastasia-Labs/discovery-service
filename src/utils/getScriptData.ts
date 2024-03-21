import { Script } from "price-discovery-offchain";
import { getAppliedScripts } from "./files.js";
import { getLucidInstance } from "./wallet.js";

const getScriptData = async () => {
  const lucid = await getLucidInstance();
  const applied = await getAppliedScripts();

  for (const [key, script] of Object.entries(applied.scripts)) {
    const scriptData: Script = {
      type: key === "proxyTokenHolderValidator" ? "PlutusV1" : "PlutusV2",
      script,
    };
    console.log(key, {
      address: lucid.utils.validatorToAddress(scriptData),
      hash: lucid.utils.validatorToScriptHash(scriptData),
    });
  }
};

getScriptData();
