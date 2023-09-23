import { setTimeout } from "timers/promises";
import dotenv from "dotenv";
dotenv.config();
import { writeFile } from "node:fs";
import {
  Blockfrost,
  generateSeedPhrase,
  Lucid,
  Network,
} from "price-discovery-offchain";
import wallets from "../../test/wallets.json" assert { type: "json" };

const lucid = await Lucid.new(
  new Blockfrost(process.env.API_URL!, process.env.API_KEY),
  process.env.NETWORK as Network
);

lucid.selectWalletFromSeed(process.env.WALLET_PROJECT_0!);

const maxRetries = 3;

for (const wallet of wallets) {
  // offset wallet & blockchain sync
  await setTimeout(5_000);
  let retries = 0;
  while (retries < maxRetries) {
    retries > 0 ? console.log(`retrying ${retries}`) : null;

    try {
      const tx = await lucid
        .newTx()
        .payToAddress(wallet.address, { lovelace: 20_000_000n })
        .complete();
      const txHash = await (await tx.sign().complete()).submit();
      await lucid.awaitTx(txHash);
      console.log(`submitted TxHash:  ${txHash}`);
      break;
    } catch (error) {
      retries++;
      console.log(`error : ${error}`);
    }
  }
}
