import { Organization } from "@allocations/core-models";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import { SNSEvent } from "aws-lambda";

export const handler = async ({ Records }: SNSEvent): Promise<void> => {
  await connectMongoose();

  for (const record of Records) {
    try {
      const deal = JSON.parse(record.Sns.Message);
      const organization = await Organization.findById(deal.organization_id);

      if (!organization) {
        throw new Error(
          `Unable to find Organization with id ${deal.organization_id}`
        );
      }

      if (organization.phase !== "onboarded") continue;

      await triggerTransition({
        id: organization._id.toString(),
        action: "DONE",
        phase: "onboarded",
      });
    } catch (e: any) {
      console.error(e);
    }
  }
};
