import type { SNSEvent } from "aws-lambda";
import {
  connectMongoose,
  LambdaEvent,
  parseRequest,
  send,
  sendError,
  sendMessage,
  triggerTransition,
} from "@allocations/service-common";
import { InvestorPassport, KYCResult } from "@allocations/core-models";
import { getNameScanData } from "./utils";

const performKYC = async (
  passport: InvestorPassport,
  {
    filterKey,
    service,
    app,
  }: { filterKey?: string; service?: string; app?: string } = {}
) => {
  const kyc = await getNameScanData(passport);
  const kycResult = await KYCResult.create({
    passport_id: passport._id,
    passed: kyc.passed,
    raw: kyc.hits,
  });

  if (filterKey) {
    await sendMessage({
      id: passport._id.toString(),
      filterKey,
      service,
      app,
      payload: { id: passport._id, result: kycResult },
      event: "kyc-results",
    });
  }

  if (!kycResult.passed) {
    await triggerTransition({
      id: passport._id.toString(),
      action: "FAILED",
      phase: "kyc",
    });
  } else {
    await triggerTransition({
      id: passport._id.toString(),
      action: "DONE",
      phase: "kyc",
    });
  }

  return kycResult;
};

const kyc = async (
  id: string,
  {
    filterKey,
    service,
    app,
  }: { filterKey?: string; service?: string; app?: string } = {},
  force: boolean = false
) => {
  const passport = await InvestorPassport.findById(id);

  if (!passport) {
    throw new Error(`Unable to find Investor Passport during KYC id: ${id}`);
  }

  if (force) return performKYC(passport, { filterKey, service, app });

  if (
    filterKey &&
    (passport.phase === "self-accredited" || passport.phase === "review")
  ) {
    const kycResult = await KYCResult.findOne({ passport_id: id }).sort({
      _id: -1,
    });
    await sendMessage({
      id,
      filterKey,
      service,
      app,
      payload: {
        id: passport._id,
        result: kycResult,
      },
      event: "kyc-results",
    });

    return kycResult;
  }

  if (passport.phase !== "kyc") return;
  return performKYC(passport, { filterKey, service, app });
};

export const snsHandler = async ({ Records }: SNSEvent) => {
  await connectMongoose();

  for (const record of Records) {
    try {
      const { id, filterKey, service, app } = JSON.parse(record.Sns.Message);
      await kyc(id, { filterKey, service, app });
    } catch (err: any) {
      console.error(err);
    }
  }
};

export const httpHandler = async (event: LambdaEvent) => {
  try {
    const { body = {} } = parseRequest(event);
    await connectMongoose();

    const kycResult = await kyc(body.id, {}, body.force);

    return send(kycResult);
  } catch (err: any) {
    console.error(err);
    return sendError({ error: err, status: err.status });
  }
};
