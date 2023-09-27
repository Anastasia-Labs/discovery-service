import { setTimeout } from "timers/promises";
import dotenv from "dotenv";
dotenv.config();
import {
  Blockfrost,
  Lucid,
  Network,
} from "price-discovery-offchain";
import wallets from "../../test/wallets.json" assert { type: "json" };
import { safeAsync, signSubmitValidate } from "./misc.js";

const lucid = await Lucid.new(
  new Blockfrost(process.env.API_URL!, process.env.API_KEY),
  process.env.NETWORK as Network
);

lucid.selectWalletFromSeed(process.env.WALLET_PROJECT_0!);

const maxRetries = 3;

for (const [index, wallet] of wallets.entries()) {
  // offset wallet & blockchain sync
  await setTimeout(5_000);
  let retries = 0;
  while (retries < maxRetries) {
    retries > 0 ? console.log(`retrying ${retries}`) : null;
    console.log(
      `\n sending funds to Wallet ${index} , address: ${wallet.address}`
    );

    const tx = await safeAsync(async () =>
      lucid
        .newTx()
        .payToAddress(wallet.address, { lovelace: 5_000_000n })
        .complete()
    );

    const isValid = await signSubmitValidate(lucid, tx);
    if (isValid) break
    retries++;
  }
}
