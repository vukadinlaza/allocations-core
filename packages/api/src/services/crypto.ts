import { CryptoTransaction } from "@allocations/core-models";
import { requestFactory } from "./request";

const request = requestFactory(process.env.INVESTMENT_V2_SERVICE_URL!);

export const initializeCryptoTransaction = (
  cryptoTransaction: CryptoTransaction,
  token: string
) => {
  return request({
    token,
    path: "/initialize",
    method: "POST",
    body: { id: cryptoTransaction._id },
  });
};
