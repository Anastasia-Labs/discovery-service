import dotenv from "dotenv";
dotenv.config();
import { Lucid } from "price-discovery-offchain";

import { selectLucidWallet } from "./wallet.js";
import { lovelaceAtAddress } from "./misc.js";

export const refundWalletsAction = async (lucid: Lucid) => {
  await selectLucidWallet(lucid, 0);
  const balance = await lovelaceAtAddress(lucid);

  const tx = await lucid
    .newTx()
    .payToAddress(
      "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
      { lovelace: balance - 500_000n },
    )
    .complete();
  const txHash = await (await tx.sign().complete()).submit();

  console.log(
    `Refunded seed wallet of ${balance - 500_000n} lovelace:  ${txHash}`,
  );

  await selectLucidWallet(lucid, 2);
  const newBalance = await lovelaceAtAddress(lucid);
  const newTx = await lucid
    .newTx()
    .payToAddress(
      "addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s",
      { lovelace: newBalance - 500_000n },
    )
    .complete();
  const newTxHash = await (await newTx.sign().complete()).submit();

  console.log(
    `Refunded deploy wallet of ${newBalance - 500_000n} lovelace:  ${newTxHash}`,
  );
};
