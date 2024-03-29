import "./env.js";

import {
  fromText,
  Lucid,
  MintingPolicy,
  PolicyId,
  toUnit,
} from "price-discovery-offchain";

import { getWallets, updateTasteTestVariables } from "./files.js";
import { isDryRun } from "./misc.js";
import { selectLucidWallet } from "./wallet.js";

export async function mintNFTAction(lucid: Lucid) {
  const wallets = await getWallets();
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
  const assetName = fromText(process.env.PROJECT_TN!);

  const unit = toUnit(policyId, assetName);

  const externalTokenProvider =
    process.env.SHOULD_BUILD_TOKEN_DEPOSIT_TX! !== "false";

  const tx = await lucid
    .newTx()
    .mintAssets({ [unit]: BigInt(process.env.PROJECT_AMNT!) })
    .validTo(Date.now() + 100000)
    .payToAddress(
      externalTokenProvider
        ? process.env.PROJECT_TOKEN_HOLDER_ADDRESS!
        : wallets[1].address,
      {
        lovelace: 1_500_000n,
        [unit]: BigInt(process.env.PROJECT_AMNT!),
      },
    )
    .attachMintingPolicy(mintingPolicy)
    .complete();

  if (isDryRun()) {
    console.log(tx.toString());
  } else {
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
}
