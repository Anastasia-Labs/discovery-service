import { Blockfrost, Lucid, Network } from "@anastasia-labs/lucid-cardano-fork";
import { MAINNET_OFFSET, PREVIEW_OFFSET } from "../constants/network.js";

export const selectLucidWallet = async (index: 0 | 1 | 2) => {
    const lucid = await Lucid.new(
        new Blockfrost(process.env.API_URL!, process.env.API_KEY),
        process.env.NETWORK as Network
      );
      lucid.selectWalletFromSeed(process.env[`WALLET_PROJECT_${index}`] as string);

      return lucid;
}

export const fetchFromBlockfrost = async (slug: string) => {
  return fetch(`${process.env.API_URL}/${slug}`, {
    method: "GET",
    headers: {
      "project_id": process.env.API_KEY as string
    }
  }).then(res => res.json()).catch(e => console.log(e))
}

export const posixToSlot = (timestamp: number | string) => Math.floor(
  Math.trunc(Math.floor(Number(timestamp) / 1000)) -
    ((process.env.NETWORK as string) === "Mainnet"
      ? Number(MAINNET_OFFSET)
      : Number(PREVIEW_OFFSET))
);

export const slotToPosix = (slot: number | string) => Math.floor(
  Math.trunc(Math.floor(Number(slot) * 1000)) +
    ((process.env.NETWORK as string) === "Mainnet"
      ? Number(MAINNET_OFFSET)
      : Number(PREVIEW_OFFSET))
);