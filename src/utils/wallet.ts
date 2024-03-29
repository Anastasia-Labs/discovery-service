import "./env.js";

import { Blockfrost, Lucid, Network } from "price-discovery-offchain";

import { MAINNET_OFFSET, PREVIEW_OFFSET } from "../constants/network.js";
import { getWallets } from "./files.js";

let lucidInstance: Lucid;

export const getNewBlockfrostInstance = () =>
  new Blockfrost(process.env.API_URL!, process.env.API_KEY);

export const getLucidInstance = async () => {
  if (!lucidInstance) {
    lucidInstance = await Lucid.new(
      getNewBlockfrostInstance(),
      process.env.NETWORK as Network,
    );
  }

  return lucidInstance;
};

export const selectLucidWallet = async (lucid: Lucid, index: number) => {
  const wallets = await getWallets();
  lucid.selectWalletFromSeed(wallets[index].seed as string);

  return lucid;
};

export const fetchFromBlockfrost = async (slug: string) => {
  return fetch(`${process.env.API_URL}/${slug}`, {
    method: "GET",
    headers: {
      project_id: process.env.API_KEY as string,
    },
  })
    .then((res) => res.json())
    .catch((e) => console.log(e));
};

export const posixToSlot = (timestamp: number | string) =>
  Math.floor(
    Math.trunc(Math.floor(Number(timestamp) / 1000)) -
      ((process.env.NODE_ENV as string).includes("mainnet")
        ? Number(MAINNET_OFFSET)
        : Number(PREVIEW_OFFSET)),
  );

export const slotToPosix = (slot: number | string) =>
  Math.floor(
    Math.trunc(Math.floor(Number(slot) * 1000)) +
      ((process.env.NODE_ENV as string).includes("mainnet")
        ? Number(MAINNET_OFFSET)
        : Number(PREVIEW_OFFSET)),
  );
