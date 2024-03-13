import dotenv from "dotenv";
dotenv.config();
import { selectLucidWallet } from "./wallet.js";
import { lovelaceAtAddress } from "./misc.js";

const lucid = await selectLucidWallet(0);

const refund = async () => {
  const balance = await lovelaceAtAddress(lucid)
  
  const tx = await lucid
    .newTx()
    .payToAddress("addr_test1qrp8nglm8d8x9w783c5g0qa4spzaft5z5xyx0kp495p8wksjrlfzuz6h4ssxlm78v0utlgrhryvl2gvtgp53a6j9zngqtjfk6s", { lovelace:  balance - 500_000n })
    .complete();
  const txHash = await (await tx.sign().complete()).submit();
  
  console.log(`submitted TxHash:  ${txHash}`);
}

refund();