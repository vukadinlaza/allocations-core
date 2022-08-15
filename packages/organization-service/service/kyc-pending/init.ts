import type { SQSEvent } from "aws-lambda";
import { connectMongoose, sendMessage } from "@allocations/service-common";
import {
  Organization,
  OrganizationFundManager,
} from "@allocations/core-models";

export const handler = async ({ Records }: SQSEvent) => {
  await connectMongoose();

  for (const record of Records) {
    try {
      const { Message } = JSON.parse(record.body);
      const organization = Organization.hydrate(JSON.parse(Message));

      const { fund_managers } = await organization.populate<{
        fund_managers: OrganizationFundManager[];
      }>("fund_managers");

      await Promise.all(
        fund_managers.map((fund_manager) => {
          return sendMessage({
            id: organization._id.toString(),
            service: "passport-service",
            app: "core",
            payload: {
              id: fund_manager.passport_id,
              filterKey: "organization-kyc",
              service: "organization-service",
              app: "core",
            },
            event: "trigger-kyc",
          });
        })
      );
    } catch (err: any) {
      console.error(err);
    }
  }
};
