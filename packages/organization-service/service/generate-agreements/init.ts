import type { SQSEvent } from "aws-lambda";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import { Organization, OrganizationAgreement } from "@allocations/core-models";
import {
  createMOUAgreement,
  createServicesAgreement,
} from "../../utils/docspring";

export const handler = async ({ Records }: SQSEvent) => {
  try {
    await connectMongoose();

    for (const record of Records) {
      const { Message } = JSON.parse(record.body);
      const organization = Organization.hydrate(JSON.parse(Message));

      const [servicesAgreement, mou] = await Promise.all([
        OrganizationAgreement.findOne({
          organization_id: organization._id,
          type: "services-agreement",
        }),
        OrganizationAgreement.findOne({
          organization_id: organization._id,
          type: "memorandum-of-understanding",
        }),
      ]);

      let waitingForGeneration = false;
      if (!servicesAgreement) {
        waitingForGeneration = true;
        await createServicesAgreement(organization);
      }

      if (organization.high_volume_partner && !mou) {
        waitingForGeneration = true;
        await createMOUAgreement(organization);
      }

      if (waitingForGeneration) continue;

      triggerTransition({
        id: organization._id.toString(),
        action: "GENERATION_COMPLETE",
        phase: "generate-agreements",
      });
    }
  } catch (err: any) {
    console.error(err);
  }
};
