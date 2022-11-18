# Stand Alone Crypto Module

## Invest Page
Add "invest with crypto" button to
`https://demo.allocations.com/next-steps/allocations/demo-space-x`

this will open
- For POC will take user_id, deal_id, investment_id, etc from url params
- Input for amount 
- Adds 1.5% crypto fee
- Will open url returned from coinbase in another window
- View crypto-transactions by user_id
___

## Crypto FM/Admin Page

- For POC will take deal_id from url params
- Will show:
  - list of completed crypto_transactions
  - total value of crypto_transactions
- Withdraw to Bank Account button
___

## Staging Webhooks

- For staging, webhooks for paid crypto charges 
- https://allocations-crypto-api-staging.herokuapp.com/v1/webhooks