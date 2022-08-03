import { Investment } from "@allocations/core-models";
import { requestFactory } from "./request";

const request = requestFactory(process.env.INVESTMENT_V2_SERVICE_URL!);

export const initializeInvestment = (investment: Investment, token: string) => {
  return request({
    token,
    path: "/initialize",
    method: "POST",
    body: { id: investment._id },
  });
};

export const editInvestment = (investment: Investment, token: string) => {
  return request({
    token,
    path: "/edit",
    method: "POST",
    body: { id: investment._id },
  });
};

export const checkAgreements = (investment_id: string, token: string) => {
  return request({
    token,
    path: "/agreements-pending/check",
    method: "POST",
    body: { id: investment_id },
  });
};
