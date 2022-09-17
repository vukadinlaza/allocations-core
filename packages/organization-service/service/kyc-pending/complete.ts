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
    const { id: passportId, result } = JSON.parse(record.Sns.Message);
    if (!result?.passed) continue;

    try {
      const admins = await OrganizationFundManager.find({
        passport_id: passportId,
      }).populate<{ organization: Organization }>("organization");

      await Promise.all(
        admins
          .filter((admin) => admin.organization.phase === "kyc-pending")
          .map((admin) => {
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
