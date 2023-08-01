import dotenv from "dotenv";
dotenv.config();
import {
  Blockfrost,
  initFold,
  InitFoldConfig,
  initNode,
  InitNodeConfig,
  initTokenHolder,
  InitTokenHolderConfig,
  Lucid,
  multiFold,
  MultiFoldConfig,
  Network,
  parseUTxOsAtScript,
  sortByOutRefWithIndex,
} from "price-discovery-offchain";

import applied from "../applied-scripts-1690385346726.json" assert { type: "json" };
import refScripts from "../deploy-policy-1690385346726.json" assert { type: "json" };

const run = async () => {
  const lucid = await Lucid.new(
    new Blockfrost(process.env.API_URL!, process.env.API_KEY),
    process.env.NETWORK as Network
  );

  const sortedInputs = sortByOutRefWithIndex(
    await parseUTxOsAtScript(lucid, applied.scripts.discoveryValidator)
  );

  const multiFoldConfig: MultiFoldConfig = {
    nodeRefInputs: sortedInputs.map((data) => {
      return data.value.outRef;
    }),
    indices: sortedInputs.map((data) => {
      return data.index;
    }),
    scripts: {
      foldPolicy: applied.scripts.foldPolicy,
      foldValidator: applied.scripts.foldValidator,
    },
  };

  lucid.selectWalletFromSeed(process.env.WALLET_BENEFICIARY_1!);
  const multiFoldUnsigned = await multiFold(lucid, multiFoldConfig);

  if (multiFoldUnsigned.type == "error") {
    console.log(multiFoldUnsigned.error);
    return;
  }

  // console.log(initNodeUnsigned.data.txComplete.to_json());
  const multiFoldSigned = await multiFoldUnsigned.data.sign().complete();
  const multiFoldHash = await multiFoldSigned.submit();
  await lucid.awaitTx(multiFoldHash);
  console.log("submitted TxHash: ", multiFoldHash);
};

await run();
