import dotenv from "dotenv";
dotenv.config();

import {
  Emulator,
  Lucid,
  createLiquidityV1Pool,
} from "price-discovery-offchain";
import { getDatumsObject } from "../../utils/emulator.js";
import { getAppliedScripts } from "../../utils/files.js";
import { selectLucidWallet } from "../../utils/wallet.js";

export const createV1PoolAction = async (
  lucid: Lucid,
  emulator?: Emulator,
  proxyDatum?: string,
  policyId?: string,
  assetName?: string,
) => {
  const applied = await getAppliedScripts();
  await selectLucidWallet(lucid, 0);

  const datums = getDatumsObject(lucid, emulator);

  if (proxyDatum) {
    const hash = lucid.utils.datumToHash(proxyDatum);
    datums[hash] = proxyDatum;
  }

  const unsignedTx = await createLiquidityV1Pool(lucid, {
    currenTime: emulator?.now() ?? Date.now(),
    scripts: {
      proxyTokenHolderScript: applied.scripts.proxyTokenHolderValidator,
      v1PoolPolicyScript: process.env.V1_POOL_POLICY_SCRIPT!,
      v1FactoryValidatorScript: process.env.V1_POOL_FACTORY_VALIDATOR!,
      tokenHolderPolicy: applied.scripts.tokenHolderPolicy,
    },
    v1PoolAddress: process.env.POOL_ADDRESS!,
    v1PoolPolicyId: process.env.POOL_POLICY_ID!,
    projectToken: {
      assetName: Buffer.from(assetName ?? process.env.PROJECT_TN!).toString(
        "hex",
      ),
      policyId: policyId ?? process.env.PROJECT_CS!,
    },
    v1FactoryToken: {
      policyId: process.env.V1_FACTORY_TOKEN!.split(".")[0],
      assetName: process.env.V1_FACTORY_TOKEN!.split(".")[1],
    },
    datums,
    emulator: Boolean(emulator),
  });

  if (unsignedTx.type == "error") {
    console.log(unsignedTx.error);
    return;
  }

  const signedTx = await unsignedTx.data.tx.sign().complete();
  const txHash = await signedTx.submit();
  console.log(`Submitting: ${txHash}`);
  await lucid.awaitTx(txHash);

  return {
    lpToken: unsignedTx.data.lpTokenAsset,
    newProxyDatum: unsignedTx.data.newProxyDatum,
  };
};
