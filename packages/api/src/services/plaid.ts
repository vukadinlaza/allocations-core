import { requestFactory } from "./request";
import { PlaidAccount, PlaidTransaction } from "@allocations/core-models";

const request = requestFactory(process.env.PLAID_SERVICE_URL!);

export const initializePlaidAccount = (
  account: PlaidAccount,
  token: string
) => {
  return request({
    token,
    path: "/initialize",
    method: "POST",
    body: { id: account._id },
  });
};

export const reconcilePlaidTransaction = (
  transaction: PlaidTransaction,
  token: string
) => {
  return request({
    token,
    path: "/reconcile",
    method: "POST",
    body: { id: transaction._id },
  });
};
