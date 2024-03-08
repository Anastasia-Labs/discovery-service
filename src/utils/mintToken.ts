import dotenv from "dotenv";
import inquirer from "inquirer";
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
} from "@anastasia-labs/lucid-cardano-fork";

const lucid = await Lucid.new(
  new Blockfrost(process.env.API_URL!, process.env.API_KEY),
  process.env.NETWORK as Network
);

lucid.selectWalletFromSeed(process.env.WALLET_PROJECT_1!)

const lucid2 = await Lucid.new(
  new Blockfrost(process.env.API_URL!, process.env.API_KEY),
  process.env.NETWORK as Network
);

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

export async function mintNFT(): Promise<TxHash> {
  const { value } = await inquirer.prompt<{ value: string }>([
    {
      type: 'input',
      name: 'value',
      message: 'What do you want to name your token? (no spaces, one word)',
    }
  ]);
  
  const unit: Unit = policyId + fromText(value);

  const tx = await lucid
    .newTx()
    .mintAssets({ [unit]: 100000000n })
    .validTo(Date.now() + 100000)
    .attachMintingPolicy(mintingPolicy)
    .complete();

  const signedTx = await tx.sign().complete();

  const txHash = await signedTx.submit();

  console.log(`Minted token ${value} under policy ID (${policyId}). TxHash: ${txHash}`)
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

mintNFT();