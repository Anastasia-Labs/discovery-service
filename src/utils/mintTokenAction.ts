import "./env.js";

import {
  Emulator,
  fromText,
  Lucid,
  MintingPolicy,
  PolicyId,
  toUnit,
} from "price-discovery-offchain";

import { isDryRun } from "./args.js";
import {
  getMintTokenTx,
  getTTConfig,
  saveMintTokenTx,
  updateTTVariables,
} from "./files.js";
import { selectLucidWallet } from "./wallet.js";

const submitMintTokenAction = async (lucid: Lucid) => {
  const completedTx = lucid.fromTx(await getMintTokenTx());
  const signed = await completedTx.sign().complete();
  const txHash = await signed.submit();
  console.log(`Submitting: ${txHash}`);
  await lucid.awaitTx(txHash);
  console.log(`Done!`);
};

export async function mintTokenAction(lucid: Lucid, emulator?: Emulator) {
  const {
    project: { token },
  } = await getTTConfig();
  await selectLucidWallet(lucid, 1);

  if (!isDryRun() && !emulator) {
    await submitMintTokenAction(lucid);
    return;
  }

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
  const assetName = fromText(token.readableName);

  const unit = toUnit(policyId, assetName);

  const tx = await lucid
    .newTx()
    .mintAssets({ [unit]: BigInt(token.suppliedAmount) })
    .validTo(Date.now() + 100000)
    .attachMintingPolicy(mintingPolicy)
    .complete();

  await updateTTVariables({
    projectTokenPolicyId: policyId,
  });

  await saveMintTokenTx((await tx.complete()).toString());

  if (emulator) {
    await submitMintTokenAction(lucid);
  }
}
