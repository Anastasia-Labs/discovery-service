import dotenv from "dotenv"
dotenv.config()
import {Blockfrost, generateSeedPhrase, Lucid, Network} from "price-discovery-offchain";

const lucid = await Lucid.new(new Blockfrost(process.env.API_URL!, process.env.API_KEY), process.env.NETWORK as Network)

const seed = generateSeedPhrase()
console.log(seed)
console.log(await lucid.selectWalletFromSeed(seed).wallet.address())
