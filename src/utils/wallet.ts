import { Blockfrost, Lucid, Network } from "price-discovery-offchain";
import { MAINNET_OFFSET, PREVIEW_OFFSET } from "../constants/network.js";

let lucidInstance: Lucid;

export const getLucidInstance = async () => {
  if (!lucidInstance) {
    lucidInstance = await Lucid.new(
     new Blockfrost(process.env.API_URL!, process.env.API_KEY),
     process.env.NETWORK as Network
   );
  }

  return lucidInstance;
}

export const selectLucidWallet = async (lucid: Lucid, index: number) => {
  const { default: wallets } = await import("../../test/wallets.json", { assert: { type: "json" } })
  lucid.selectWalletFromSeed(wallets[index].seed as string);

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