import {
  Entity,
  Organization,
  OrganizationFundManager,
} from "@allocations/core-models";
import {
  connectMongoose,
  sendMessage,
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

      const [manager, member] = await Promise.all([
        OrganizationFundManager.findOne({
          organization_id: org._id,
          role: "fund-manager",
        }),
        OrganizationFundManager.findOne({
          organization_id: org._id,
          role: "banking-manager",
        }),
      ]);

      if (!manager || !member) {
        await triggerTransition({
          id: organization._id.toString(),
          action: "ERROR",
          phase: "entity-pending",
        });
      }

      const entity = await Entity.create({
        name: org.desired_entity_name,
        phase: "new",
        organization_id: org._id,
        structure: "LLC",
        manager_passport_id: manager!.organization_id,
        member_passport_id: member!.organization_id,
      });

      await sendMessage({
        id: entity._id.toString(),
        service: "entity-service",
        app: "core",
        event: "entity-initialize",
      });
    }
  } catch (err: any) {
    console.error(err);
  }
};
