import dotenv from "dotenv"
dotenv.config()
import {Blockfrost, generateSeedPhrase, Lucid, Network} from "price-discovery-offchain";

const lucid = await Lucid.new(new Blockfrost(process.env.API_URL!, process.env.API_KEY), process.env.NETWORK as Network)

lucid.selectWalletFromSeed(process.env.WALLET_PROJECT_1!)
console.log(await lucid.wallet.address())
