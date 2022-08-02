import {
  Organization,
  OrganizationFundManager,
} from "@allocations/core-models";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import { SNSEvent } from "aws-lambda";

export const handler = async ({ Records }: SNSEvent): Promise<void> => {
  await connectMongoose();

  for (const record of Records) {
    const { id: passportId } = JSON.parse(record.Sns.Message);

    try {
      const admins = await OrganizationFundManager.aggregate<
        OrganizationFundManager & { organization: Organization }
      >([
        { $match: { passport_id: passportId } },
        {
          $lookup: {
            from: Organization.collection.name,
            localField: "organization_id",
            foreignField: "_id",
            as: "organization",
          },
        },
        { $match: { "organization.phase": "kyc-pending" } },
      ]);

      await Promise.all(
        admins.map((admin) => {
          return triggerTransition({
            id: admin.organization_id.toString(),
            action: "DONE",
            phase: "kyc-pending",
          });
        })
      );
    } catch (e: any) {
      console.error(e);
    }
  }
};
