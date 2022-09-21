import { Organization } from "@allocations/core-models";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import { SQSEvent } from "aws-lambda";

export const handler = async ({ Records }: SQSEvent) => {
  try {
    await connectMongoose();

    for (const record of Records) {
      const { Message } = JSON.parse(record.body);

      const { organization: org } = JSON.parse(Message);

      const organization = await Organization.findById(org.id);

      if (!organization) continue;

      if (!organization.high_volume_partner) {
        await triggerTransition({
          id: organization._id.toString(),
          action: "DONE",
          phase: "entity-pending",
        });
      }
    }
  } catch (err: any) {
    console.error(err);
  }
};
