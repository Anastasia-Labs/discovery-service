import dotenv from "dotenv";
dotenv.config();

import {
    Blockfrost,
    fromText,
    Lucid,
    MintingPolicy,
    PolicyId,
    TxHash,
    Unit,
    Network
  } from "lucid-cardano";

  const TEST_TOKEN_NAME = "SSLTest1"
  
  const lucid = await Lucid.new(
    new Blockfrost(process.env.API_URL!, process.env.API_KEY),
    process.env.NETWORK as Network
  );
  
  lucid.selectWalletFromSeed(process.env.WALLET_PROJECT_0!)
  
  const { paymentCredential } = lucid.utils.getAddressDetails(
    await lucid.wallet.address(),
  );
  
  const mintingPolicy: MintingPolicy = lucid.utils.nativeScriptFromJson(
    {
      type: "all",
      scripts: [
        { type: "sig", keyHash: paymentCredential?.hash! },
        {
          type: "before",
          slot: lucid.utils.unixTimeToSlot(Date.now() + 1000000),
        },
      ],
    },
  );
  
  const policyId: PolicyId = lucid.utils.mintingPolicyToId(
    mintingPolicy,
  );
  
  export async function mintNFT(
    name: string,
  ): Promise<TxHash> {
    const unit: Unit = policyId + fromText(name);
  
    const tx = await lucid
      .newTx()
      .mintAssets({ [unit]: 100000000n })
      .validTo(Date.now() + 100000)
      .attachMintingPolicy(mintingPolicy)
      .complete();
  
    const signedTx = await tx.sign().complete();
  
    const txHash = await signedTx.submit();
  
    return txHash;
  }
  
  export async function burnNFT(
    name: string,
  ): Promise<TxHash> {
    const unit: Unit = policyId + fromText(name);
  
    const tx = await lucid
      .newTx()
      .mintAssets({ [unit]: -1n })
      .validTo(Date.now() + 100000)
      .attachMintingPolicy(mintingPolicy)
      .complete();
  
    const signedTx = await tx.sign().complete();
  
    const txHash = await signedTx.submit();
  
    return txHash;
  }

  mintNFT(TEST_TOKEN_NAME);