## Setting Up a Test Test

- Run `yarn create-wallets`
- Update the `.env` file with the first 3 wallet seeds generated above. BENEFICIARY_ADDRESS can be whatever you want.
- Fund wallet Project 0 with testnet funds (at least 2,000 ADA).
- Then run `yarn fund-wallets` to fund other wallets (this can take a while).
- Then create a new test token with `yarn mint-token` (change the token name before executing).
- Update the `.env` file with token policy ID and token name.
- Then run `yarn build-scripts` or `yarn build-scripts:lp` for liquidity taste tests.
- Once `./applied-scripts.json` file is created, run `yarn deploy-scripts` or `yarn deploy-scripts:lp` for liquidity taste tests (**NOTE**: This takes quite a while, up to 20 minutes.)
- Once that is done, run `yarn init-discovery` or `yarn init-liquidity` for liquidity taste tests.
- Your Taste Test is live!