import type { SQSEvent } from "aws-lambda";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import { InvestorPassport } from "@allocations/core-models";

export const handler = async ({ Records }: SQSEvent): Promise<void> => {
  await connectMongoose();

  for (const record of Records) {
    const { Message } = JSON.parse(record.body);
    const passport = InvestorPassport.hydrate(JSON.parse(Message));

    if (passport.test) {
      await triggerTransition({
        id: passport._id.toString(),
        action: "DONE",
        phase: "review",
      });
    }
  }
};
