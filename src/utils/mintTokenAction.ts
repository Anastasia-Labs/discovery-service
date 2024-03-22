import dotenv from "dotenv";
dotenv.config();

import {
  fromText,
  Lucid,
  MintingPolicy,
  PolicyId,
  toUnit,
} from "price-discovery-offchain";
import { updateTasteTestVariables } from "./files.js";
import { selectLucidWallet } from "./wallet.js";

export async function mintNFTAction(lucid: Lucid) {
  await selectLucidWallet(lucid, 1);

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
  const assetName = fromText(
    process.env.NODE_ENV === "emulator" ? "TTEmulator" : "TTPreview",
  );

  const unit = toUnit(policyId, assetName);

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

  await updateTasteTestVariables({
    projectTokenPolicyId: policyId,
    projectTokenAssetName: assetName,
  });

  console.log(`Done! Saved minted asset data to taste-test-variables.json.`);
}
