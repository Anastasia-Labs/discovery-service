import dotenv from "dotenv";
dotenv.config();

import { Emulator, Lucid } from "price-discovery-offchain"
import { createLiquidityV1Pool } from "price-discovery-offchain"
import { selectLucidWallet } from "../../utils/wallet.js";

export const createV1PoolAction = async (lucid: Lucid, emulator?: Emulator, proxyDatum?: string, policyId?: string, assetName?: string) => {
    await selectLucidWallet(lucid, 0);
    const { default: proxyTokenHolderV1Validator } = await import("../../compiledLiquidity/proxyTokenHolderV1.json", { assert: { type: "json" }})

    const datums: { [key: string]: string } = {};
    if (emulator) {
        datums["d2653ed85dac06c5b39554b78875d4f8cb6680a274a0f2cf6897f2b99e35b0da"] = "d8799f4121d8798041009f581cbb0d2cc0d7f7b80d3c0d7a7ac441f3865ffd297613c67f06951eb7faffff";
    }

    if (proxyDatum) {
        const hash = lucid.utils.datumToHash(proxyDatum);
        datums[hash] = proxyDatum;
    }

    const unsignedTx = await createLiquidityV1Pool(lucid, {
        currenTime: emulator?.now() ?? Date.now(),
        scripts: {
            proxyTokenHolderScript: proxyTokenHolderV1Validator.cborHex,
            v1PoolPolicyScript: process.env.V1_POOL_POLICY_SCRIPT!,
            v1FactoryValidatorScript: process.env.V1_POOL_FACTORY_VALIDATOR!
        },
        v1PoolAddress: process.env.POOL_ADDRESS!,
        projectToken: {
            assetName: Buffer.from(assetName ?? process.env.PROJECT_TN!).toString("hex"),
            policyId: policyId ?? process.env.PROJECT_CS!
        },
        v1FactoryToken: {
            policyId: (process.env.V1_FACTORY_TOKEN!).split(".")[0],
            assetName: (process.env.V1_FACTORY_TOKEN!).split(".")[1]
        },
        datums,
        emulator: Boolean(emulator)
    })

    if (unsignedTx.type == "error") {
        console.log(unsignedTx.error);
        return;
      }

    const signedTx = await unsignedTx.data.sign().complete();
    const txHash = await signedTx.submit();
    console.log(`Submitting: ${txHash}`);
    await lucid.awaitTx(txHash);
}