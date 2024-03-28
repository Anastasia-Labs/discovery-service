import { Data } from "price-discovery-offchain";
import { getLucidInstance } from "../utils/wallet.js";

const lucid = await getLucidInstance();
lucid.selectWalletFrom({
  address: process.env.PROJECT_ADDRESS!,
  utxos: await lucid.provider.getUtxosByOutRef([
    {
      outputIndex: 0,
      txHash:
        "bf3a63bfa6a959e334819153454f0d401e2606ad4828a7c7cfecbce97e8f74ad",
    },
  ]),
});

const tx = await lucid
  .newTx()
  .payToAddressWithData(
    process.env.PROJECT_ADDRESS!,
    {
      inline: Data.void(),
    },
    { lovelace: 1_000_000n },
  )
  .complete();

console.log(tx.toString());
