import "./env.js";

import { Lucid, toUnit } from "price-discovery-offchain";

import { getTasteTestVariables } from "./files.js";
import { lovelaceAtAddress } from "./misc.js";
import { selectLucidWallet } from "./wallet.js";

export const getAddressesAction = async (lucid: Lucid) => {
  const { projectTokenAssetName, projectTokenPolicyId } =
    await getTasteTestVariables();
  const tokenName = toUnit(projectTokenPolicyId, projectTokenAssetName);

  await selectLucidWallet(lucid, 0);
  console.log("WALLET_PROJECT_0");
  console.log({
    address: await lucid.wallet.address(),
    lovelace: await lovelaceAtAddress(lucid),
  });

  await selectLucidWallet(lucid, 1);
  console.log("WALLET_PROJECT_1");
  console.log({
    address: await lucid.wallet.address(),
    lovelace: await lovelaceAtAddress(lucid),
    projectToken: (await lucid.wallet.getUtxos()).find(
      ({ assets }) => typeof assets[tokenName] !== undefined,
    )?.assets[tokenName],
  });

  console.log("WALLET_PROJECT_2");
  await selectLucidWallet(lucid, 2);
  console.log({
    address: await lucid.wallet.address(),
    lovelace: await lovelaceAtAddress(lucid),
  });
};
