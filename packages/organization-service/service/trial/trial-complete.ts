import type { SNSEvent } from "aws-lambda";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";

export const handler = async ({ Records }: SNSEvent) => {
  await connectMongoose();

  for (const record of Records) {
    try {
      const organization = JSON.parse(record.Sns.Message);
      await triggerTransition({
        id: organization._id.toString(),
        action: "DONE",
        phase: "trial",
      });
    } catch (err: any) {
      console.error(err);
    }
  }
};
