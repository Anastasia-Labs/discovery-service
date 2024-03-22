## Setting Up a Test Test

1. Run `yarn create-wallets` (it will ask you if you want to refund previous wallets. Say yes only if you know you don't need it.)
2. Once complete, fund the wallet it prints out with testnet funds (at least 5,000 ADA).
3. Then run `yarn fund-wallets` to fund other wallets (this can take a while).
4. Then create a new test token with `yarn mint-token` (change the token name before executing).
5. Update the `.env` file with a proper deadline timestamp.
6. Then run `yarn build-scripts` or `yarn build-scripts:lp` for liquidity taste tests.
7. (**Optional**): Once `./applied-scripts.json` file is created, run `yarn deploy-scripts` or `yarn deploy-scripts:lp` for liquidity taste tests (**NOTE**: This takes quite a while, up to 20 minutes.)
8. Once that is done, run `yarn init-discovery` or `yarn init-liquidity` for liquidity taste tests.
9. After this, you should see the final transaction to initialize the taste test node printed to `init-tx.json`.
10. (**Optional**): Run `yarn generate-dynamo` to generate a DynamoDB JSON file (found in `dynamodb-template.json` after running this script). You should paste this into a new entry into the appropriate Taste Test DynamoDB table so that we pick up the transaction once submitted (avoiding replays).
11. Now you can run `yarn start-tt` to submit the signed transaction.
12. Your Taste Test is live!

## Funding a Taste Test

1. Once a Taste Test has started, you can test funding it.
2. Run `yarn insert-nodes` or `yarn insert-nodes:lp`.
3. (**Optional**) Run `yarn modify-nodes` or `yarn modify-nodes:lp` to update each position by 1 ADA.
4. (**Optional**) Run `yarn remove-nodes` or `yarn remove-node:lp` to withdraw just the last position.

## Closing a Taste Test

1. Once a Taste Test has closed, you can now fold the UTxOs.
2. Run `yarn init-fold` or `yarn init-fold:lp`.
3. Run `yarn fold-nodes` or `yarn fold-nodes:lp`.
4. (**Liquidity Event Only**) Run `yarn add-collected:lp` for Liquidity TT's.
5. (**Liquidity Event Only**) Run `yarn spend-to-proxy:lp` for Spending to the proxy UTXO.
6. (**Liquidity Event Only**) Run `yarn create-v1-pool:lp` for Creating the V1 Pool.
