import type { InvestorPassport } from "@allocations/core-models";
import { requestFactory } from "./request";

const request = requestFactory(process.env.PASSPORT_SERVICE_URL!);

export const initializePassport = async (
  investorPassport: InvestorPassport,
  token: string
) => {
  return request({
    token,
    path: "/initialize",
    method: "POST",
    body: { id: investorPassport._id },
  });
};

export const checkPassportOnboardingStatus = async (
  investorPassport: InvestorPassport,
  token: string
) => {
  return request({
    token,
    path: "/check-onboarding-status",
    method: "POST",
    body: { id: investorPassport._id },
  });
};

export const completePassportReview = async (
  passportId: string,
  action: string,
  token: string
) => {
  return request({
    token,
    path: "/review",
    method: "POST",
    body: { id: passportId, action },
  });
};

export const triggerKYC = async (passportId: string, token: string) => {
  return request({
    token,
    path: "/kyc",
    method: "POST",
    body: { id: passportId },
  });
};
