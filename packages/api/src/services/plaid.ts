import { requestFactory } from "./request";
import { PlaidAccount } from "@allocations/core-models";

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
