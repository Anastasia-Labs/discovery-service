## Setting Up a Test Test

- Run `yarn create-wallets`
- Update the `.env` file with wallet seeds.
- Fund wallet Project 0 with testnet funds.
- Then run `yarn fund-wallets` to fund other wallets.
- Then create a new test token with `yarn mint-token` (change the token name before executing).
- Update the `.env` file with token policy ID and token name.
- Then run `yarn build-scripts`
- Once `./applied-scripts.json` file is created, run `yarn deploy-scripts` (**NOTE**: This takes quite a while.)
- Once that is done, run `yarn initialize-discovery`
- Your Taste Test is live!