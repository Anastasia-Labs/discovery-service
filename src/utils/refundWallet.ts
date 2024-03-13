import dotenv from "dotenv";
dotenv.config();
import { selectLucidWallet } from "./wallet.js";

const lucid = await selectLucidWallet(0);

const tx = await lucid
  .newTx()
  .payToAddress("addr_test1qruuags3hcf5h5cydlqcendq50v489h4k8ap2y3p3dkpgt5elrhta8vpt75q0mpdjvmxy9a4xep4p5y8w9mf8ajv5skqjttvnt", { lovelace:  137_310_098_423n})
  .complete();
const txHash = await (await tx.sign().complete()).submit();

await lucid.awaitTx(txHash);

console.log(`submitted TxHash:  ${txHash}`);
