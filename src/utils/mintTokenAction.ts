import dotenv from "dotenv";
import inquirer from "inquirer";
dotenv.config();

import {
  fromText,
  Lucid,
  MintingPolicy,
  PolicyId,
  TxHash,
  Unit,
} from "price-discovery-offchain";
import { selectLucidWallet } from "./wallet.js";

export async function mintNFTAction(lucid: Lucid): Promise<{
  policyId: string;
  name: string;
}> {
  await selectLucidWallet(lucid, 1);
  // const { value } = await inquirer.prompt<{ value: string }>([
  //   {
  //     type: 'input',
  //     name: 'value',
  //     message: 'What do you want to name your token? (no spaces, one word)',
  //   }
  // ]);

  const { paymentCredential } = lucid.utils.getAddressDetails(
    await lucid.wallet.address(),
  );

  const mintingPolicy: MintingPolicy = lucid.utils.nativeScriptFromJson({
    type: "all",
    scripts: [
      { type: "sig", keyHash: paymentCredential?.hash! },
      {
        type: "before",
        slot: lucid.utils.unixTimeToSlot(Date.now() + 1000000),
      },
    ],
  });

  const policyId: PolicyId = lucid.utils.mintingPolicyToId(mintingPolicy);

  const unit: Unit = policyId + fromText(process.env.PROJECT_TN!);

  const tx = await lucid
    .newTx()
    .mintAssets({ [unit]: BigInt(process.env.PROJECT_AMNT as string) })
    .validTo(Date.now() + 100000)
    .attachMintingPolicy(mintingPolicy)
    .complete();

  const signedTx = await tx.sign().complete();
  const txHash = await signedTx.submit();
  console.log(`Submitting: ${txHash}`);
  await lucid.awaitTx(txHash);

  console.log(
    `Done! Minted token ${process.env.PROJECT_TN} under policy ID (${policyId}).`,
  );
  return {
    policyId,
    name: process.env.PROJECT_TN!,
  };
}
