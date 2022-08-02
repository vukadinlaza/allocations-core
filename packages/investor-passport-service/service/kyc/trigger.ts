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

const kyc = async (id: string, filterKey?: string) => {
  const passport = await InvestorPassport.findById(id);

  if (!passport) {
    throw new Error(`Unable to find Investor Passport during KYC id: ${id}`);
  }

  if (filterKey && passport.phase !== "kyc") {
    const kycResult = await KYCResult.findOne({ passport_id: id }).sort({
      _id: -1,
    });
    await sendMessage({
      id,
      filterKey,
      payload: {
        id: passport._id,
        result: kycResult,
      },
      event: "kyc-results",
    });
  }

  const kyc = await getNameScanData(passport);
  const kycResult = await KYCResult.create({
    passport_id: passport._id,
    passed: kyc.passed,
    raw: kyc.hits,
  });

  if (filterKey) {
    await sendMessage({
      id,
      filterKey,
      payload: { id: passport._id, result: kycResult },
      event: "kyc-results",
    });
  }

  if (!kycResult.passed) {
    await triggerTransition({
      id,
      action: "FAILED",
      phase: "kyc",
    });
  } else {
    await triggerTransition({
      id,
      action: "DONE",
      phase: "kyc",
    });
  }

  return kycResult;
};

export const snsHandler = async ({ Records }: SNSEvent) => {
  await connectMongoose();

  for (const record of Records) {
    try {
      const { id, filterKey } = JSON.parse(record.Sns.Message);
      await kyc(id, filterKey);
    } catch (err: any) {
      console.error(err);
    }
  }
};

export const httpHandler = async (event: LambdaEvent) => {
  try {
    const { body = {} } = parseRequest(event);
    await connectMongoose();

    const kycResult = await kyc(body.id);

    return send(kycResult);
  } catch (err: any) {
    console.error(err);
    return sendError({ error: err, status: err.status });
  }
};
