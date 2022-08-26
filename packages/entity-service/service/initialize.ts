import type { SNSEvent } from "aws-lambda";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import { Entity } from "@allocations/core-models";

export const handler = async ({ Records }: SNSEvent) => {
  await connectMongoose();

  for (const record of Records) {
    try {
      const { id } = JSON.parse(record.Sns.Message);
      const entity = await Entity.findById(JSON.parse(id));
      if (!entity) continue;

      await triggerTransition({
        id: entity._id.toString(),
        action: "CREATED",
        phase: "new",
      });
    } catch (err: any) {
      console.error(err);
    }
  }
};
