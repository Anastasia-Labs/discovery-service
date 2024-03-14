## Setting Up a Test Test

1. Run `yarn create-wallets`
2. Fund wallet Project 0 with testnet funds (at least 2,000 ADA).
3. Then run `yarn fund-wallets` to fund other wallets (this can take a while).
4. Then create a new test token with `yarn mint-token` (change the token name before executing).
5. Update the `.env` file with token policy ID and token name.
6. Then run `yarn build-scripts` or `yarn build-scripts:lp` for liquidity taste tests.
7. Once `./applied-scripts.json` file is created, run `yarn deploy-scripts` or `yarn deploy-scripts:lp` for liquidity taste tests (**NOTE**: This takes quite a while, up to 20 minutes.)
8. Once that is done, run `yarn init-discovery` or `yarn init-liquidity` for liquidity taste tests.
9.  After this, you should see the final transaction to initialize the taste test node printed to `init-tx.json`.
10. Run `yarn build-dynamo` to generate a DynamoDB JSON file (found in `dynamodb-template.json` after running this script). You should paste this into a new entry into the appropriate Taste Test DynamoDB table so that we pick up the transaction once submitted (avoiding replays).
11. Now you can run `yarn start-tt` to submit the signed transaction.
12. Your Taste Test is live!