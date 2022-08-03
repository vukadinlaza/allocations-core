import type { SQSEvent } from "aws-lambda";
import { connectMongoose, sendMessage } from "@allocations/service-common";
import { Investment } from "@allocations/core-models";

export const handler = async ({ Records }: SQSEvent) => {
  await connectMongoose();

  for (const record of Records) {
    try {
      const { Message } = JSON.parse(record.body);
      const investment = Investment.hydrate(JSON.parse(Message));

      await sendMessage({
        id: investment._id.toString(),
        service: "passport-service",
        app: "onboarding",
        payload: {
          id: investment.passport_id,
          filterKey: "investment-kyc",
          service: "investment-v2",
          app: "core",
        },
        event: "trigger-kyc",
      });
    } catch (err: any) {
      console.error(err);
    }
  }
};
