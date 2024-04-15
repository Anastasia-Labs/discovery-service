import "./env.js";

import { Lucid, toUnit } from "price-discovery-offchain";

import inquirer from "inquirer";
import { MAX_WALLET_GROUP_COUNT } from "../constants/utils.js";
import { getTTVariables } from "./files.js";
import { lovelaceAtAddress } from "./misc.js";
import { selectLucidWallet } from "./wallet.js";

export const getBalanceAction = async (lucid: Lucid) => {
  const { projectTokenAssetName, projectTokenPolicyId } =
    await getTTVariables();

  const { getAllWallets } = await inquirer.prompt([
    {
      type: "confirm",
      name: "getAllWallets",
      message: "Get all wallets?",
      default: true,
    },
  ]);

  for (let i = 0; i < MAX_WALLET_GROUP_COUNT; i++) {
    await selectLucidWallet(lucid, i);
    const assets: Record<string, string | bigint> = {
      address: await lucid.wallet.address(),
      lovelace: await lovelaceAtAddress(lucid),
    };

    if (i === 1 && projectTokenPolicyId && projectTokenAssetName) {
      const tokenName = toUnit(projectTokenPolicyId, projectTokenAssetName);
      const utxoAssets = await lucid.provider.getUtxosWithUnit(
        assets.address as string,
        tokenName,
      );
      const tokenAsset = utxoAssets.find(
        ({ assets }) => typeof assets[tokenName] !== undefined,
      )?.assets[tokenName];

      if (tokenAsset) {
        assets[Buffer.from(projectTokenAssetName, "hex").toString("utf-8")] =
          tokenAsset;
      }
    }

    console.log(`Wallet Index: ${i}`, assets);

    if (!getAllWallets && i === 2) {
      break;
    }
  }
};
