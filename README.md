## Setting Up a Test Test

- Run `yarn ts-node --esm src/utils/createWallets.ts`
- Update the `.env` file with wallet seeds.
- Fund wallet Project 0 with testnet funds.
- Then run `yarn ts-node --esm src/utils/fundWallets.ts` to fund other wallets.
- Then create a new test token with `yarn ts-node --esm src/utils/mintToken.ts` (change the token name before executing).
- Update the `.env` file with token policy ID and token name.
- Then run `yarn ts-node --esm src/service/buildScripts.ts`
- Once `./applied-scripts.json` file is created, run `yarn ts-node --esm src/service/deployScripts.ts` (**NOTE**: This takes quite a while.)
- Once that is done, run `yarn ts-node --esm src/service/initializeDiscovery.ts`
- Your Taste Test is live!