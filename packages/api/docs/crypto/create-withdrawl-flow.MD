# Coinbase|developer - Wallets API

A POC solution for payouts in fiat from a coinbase wallet.
Assumes existing Coinbase Managed Commerce Account with settlement in USD or USDC and linked Coinbase Account/Wallet.

---

## Create Withdrawal

**Action: Under amount and clicks "withdraw"**

- FE passes the following to BE:
  - amount
  - deal_id associated with withdrawal
- BE calls withdrawal endpoint sending:
  - amount
  - currency
  - payment_method (this is the payout method and location, e.g. Connected ACH Bank Account)
- NOTE: potential intermediate step to look up payout method by deal_id. If used with Mercury virtual account (or other single account), we'll just take the deal_id

```
  curl https://api.coinbase.com/v2/accounts/<USD-fiat or USDC token account_id>/withdrawals /
  -X POST \
  --header "CB-ACCESS-KEY: <your api key>" \
  --header "CB-ACCESS-SIGN: <sha256 message signature>" \
  --header "CB-ACCESS-TIMESTAMP: <timestamp>"
  -d '{
    "amount": "10",
    "currency": "USD",
    "payment_method": "83562370-3e5c-51db-87da-752af5ab9559",
    "comitted": "true"
  }'
```

and receives a withdrawal object:

```json
{
  "data": {
    "id": "67e0eaec-07d7-54c4-a72c-2e92826897df",
    "status": "created",
    "payment_method": {
      "id": "83562370-3e5c-51db-87da-752af5ab9559",
      "resource": "payment_method",
      "resource_path": "/v2/payment-methods/83562370-3e5c-51db-87da-752af5ab9559"
    },
    "transaction": {
      "id": "441b9494-b3f0-5b98-b9b0-4d82c21c252a",
      "resource": "transaction",
      "resource_path": "/v2/accounts/2bbf394c-193b-5b2a-9155-3b4732659ede/transactions/441b9494-b3f0-5b98-b9b0-4d82c21c252a"
    },
    "amount": {
      "amount": "10.00",
      "currency": "USD"
    },
    "subtotal": {
      "amount": "10.00",
      "currency": "USD"
    },
    "created_at": "2015-01-31T20:49:02Z",
    "updated_at": "2015-02-11T16:54:02-08:00",
    "resource": "withdrawal",
    "resource_path": "/v2/accounts/2bbf394c-193b-5b2a-9155-3b4732659ede/withdrawals/67e0eaec-07d7-54c4-a72c-2e92826897df",
    "committed": true,
    "fee": {
      "amount": "0.00",
      "currency": "USD"
    },
    "payout_at": "2015-02-18T16:54:00-08:00"
  }
}
```

- BE creates a `WalletWithdrawal` document storing:
  - deal_id
  - all or most of the fields below

```json
{
  "id": "67e0eaec-07d7-54c4-a72c-2e92826897df",
  "status": "created",
  "transaction": {
    "id": "441b9494-b3f0-5b98-b9b0-4d82c21c252a",
    "resource": "transaction",
    "resource_path": "/v2/accounts/2bbf394c-193b-5b2a-9155-3b4732659ede/transactions/441b9494-b3f0-5b98-b9b0-4d82c21c252a"
  },
  "resource_path": "/v2/accounts/2bbf394c-193b-5b2a-9155-3b4732659ede/withdrawals/67e0eaec-07d7-54c4-a72c-2e92826897df",
  "payout_at": "2015-02-18T16:54:00-08:00"
}
```

---

## Confirm Withdrawal

When a withdrawal is completed or cancelled we'll be notified by webhook to:

`/v1/wallet-withdrawals/updates`

with a payload containing:

```JSON
{
  "id": "6bf0ca21-0b2f-5e8a-b95e-7bd7eaccc338",
  "type": "wallet:withdrawal:completed",
  "delivery_attempts": 0,
  "created_at": "2015-01-31T20:49:02Z",
  "resource": "notification",
  "data": {
    "id": "67e0eaec-07d7-54c4-a72c-2e92826897df",
    "status": "completed",
    "payment_method": {
      "id": "83562370-3e5c-51db-87da-752af5ab9559",
      "resource": "payment_method",
      "resource_path": "/v2/payment-methods/83562370-3e5c-51db-87da-752af5ab9559"
    }
  }
}
```

- BE Will then: 

1. Verify webhook signature using public key + signature from headers
2. Update withdrawal status in the db
3. Ability to update other data sources possible.

[Additional Documentation on Notifications/Webhooks](https://developers.coinbase.com/api/v2#notification-resource)
[Docs on securing Webhooks](https://docs.cloud.coinbase.com/sign-in-with-coinbase/docs/notifications#setting-up-notifications)

---

## Additional Features

- Display withdrawal status
- Endpoint to get withdrawal by id
- Endpoint to get withdrawals deal_id
