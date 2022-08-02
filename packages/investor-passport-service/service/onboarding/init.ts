import type { SQSEvent } from "aws-lambda";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import { InvestorPassport } from "@allocations/core-models";
import { hasIdentification } from "./utils";

export const handler = async ({ Records }: SQSEvent): Promise<void> => {
  await connectMongoose();

  for (const record of Records) {
    const { Message } = JSON.parse(record.body);
    const { _id } = JSON.parse(Message);

    const passport = await InvestorPassport.findById(_id);

    if (!passport) {
      throw new Error(
        `Unable to find Investor Passport during onboarding: ${_id}`
      );
    }

    if (await hasIdentification(passport)) {
      await triggerTransition({
        id: _id.toString(),
        action: "DONE",
        phase: "onboarding",
      });
    }
  }
};
