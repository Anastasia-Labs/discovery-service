## Setting Up a Test Test

1. All commands support the following flags:
   1. `--[network]` Used either `preview` or `mainnet`. Defaults to `--preview`.
   2. `--submit` Submits a previously built transaction.
2. Run `yarn create-wallets` (it will ask you if you want to refund previous wallets. Say yes only if you know you don't need it.)
3. Once complete, fund the wallet it prints out with funds (at least 500 ADA).
4. Run `yarn create-tt` to boot up a new taste test and config file. Update the configuration file as needed.
5. If required, run `yarn fund-wallets` to fund other wallets in a batch.
6. (**Optional**) Create a new test token with `yarn mint-token` to mint a token corresponding to your config settings.
7. Then run `yarn build-scripts`.
8. After this, run `yarn fragment-publish-wallet`.
9. Then run `yarn publish-scripts` to publish reference inputs.
10. Once done, run `yarn init-token-holder` to spend the project tokens to the token holder validator.
11. Next, run `yarn register-stake` to spend the project tokens to the token holder validator.
12. Next, run `yarn init-liquidity` to build the transaction for the first head node.
13. (**Optional**): Run `yarn generate-db` to generate a DynamoDB JSON file (found in `generated/{branchName}/{network}/dynamodb-template.json`). You should paste this into a new entry into the appropriate Taste Test DynamoDB table so that we pick up the transaction once submitted (avoiding replays).
14. Now you can run `yarn init-liquidity --submit` to submit the signed transaction and officially allow deposits.
15. Your Taste Test is live!

## Interacting With a Taste Test

1. Once a Taste Test has started, you can test funding it.
2. Run `yarn insert-nodes` to deposit 10 ADA into the TT.
3. Run `yarn modify-nodes` to update each deposit position by 1 ADA.
4. Run `yarn remove-nodes` to withdraw a few positions.

## Closing a Taste Test

1. Once a Taste Test has closed, you can now fold the UTxOs.
2. Run `yarn init-fold` to initialize the fold utxo.
3. Run `yarn fold-nodes` to fold over deposit utxos.
4. Run `yarn add-collected` to take all the deposits and add their committed ADA to token holder validator.
5. Run `yarn spend-to-proxy` to spend both the project token and the collected ADA into a PlutusV1 proxy script.
6. Run `yarn create-v1-pool` to spend these assets into a new V1 pool, receiving 50% of the generated LP tokens.
7. Run `yarn init-rewards` to initialize the reward utxo.
8. Run `yarn fold-rewards` to fold over the original fold utxos, and deposit the corresponding LP tokens into them.
9. Run `yarn claim-rewards` to collect the LP tokens for each depositing wallet (of ours).
10. You're official done!
