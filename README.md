## Setting Up a Test Test

- Run `yarn create-wallets`
- Update the `.env` file with wallet seeds.
- Fund wallet Project 0 with testnet funds.
- Ensure that `WALLET_PROJECT_2` has at least 1000 ADA.
- Then run `yarn fund-wallets` to fund other wallets.
- Then create a new test token with `yarn mint-token` (change the token name before executing).
- Update the `.env` file with token policy ID and token name.
- Then run `yarn build-scripts` for a Direct taste test, or `yarn build-liquidity-scripts` for a Liquidity taste test.
- Once `./applied-scripts.json` file is created, run `yarn deploy-scripts` for Direct, or `yarn deploy-liquidity-scripts` for Liquidity types. (**NOTE**: This takes quite a while.)
- Once that is done, run `yarn init-discovery` for a Direct taste test, or `yarn init-liquidity` for a Liquidity taste test.
- Your Taste Test is live!