import type { SQSEvent } from "aws-lambda";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import {
  InvestorPassport,
  Organization,
  OrganizationAgreement,
  OrganizationFundManager,
} from "@allocations/core-models";
import {
  createMOUAgreement,
  createPOAAgreement,
  createServicesAgreement,
  createTermsAgreement,
} from "../../utils/docspring";

export const handler = async ({ Records }: SQSEvent) => {
  try {
    await connectMongoose();

    for (const record of Records) {
      const { Message } = JSON.parse(record.body);
      const organization = Organization.hydrate(JSON.parse(Message));

      const fundManager = await OrganizationFundManager.findOne({
        organization_id: organization._id,
        role: "fund-manager",
      }).populate<{ passport: InvestorPassport }>("passport");

      const [terms, servicesAgreement, poa, mou] = await Promise.all([
        OrganizationAgreement.findOne({
          organization_id: organization._id,
          type: "terms-and-conditions",
        }),
        OrganizationAgreement.findOne({
          organization_id: organization._id,
          type: "services-agreement",
        }),
        OrganizationAgreement.findOne({
          organization_id: organization._id,
          type: "power-of-attorney",
        }),
        OrganizationAgreement.findOne({
          organization_id: organization._id,
          type: "memorandum-of-understanding",
        }),
      ]);

      let waitingForGeneration = false;
      if (!terms) {
        waitingForGeneration = true;
        await createTermsAgreement(organization);
      }

      if (!servicesAgreement) {
        waitingForGeneration = true;
        await createServicesAgreement({
          ...organization,
          //@ts-ignore
          fund_manager: fundManager?.passport.name,
        });
      }

      if (!poa) {
        waitingForGeneration = true;
        await createPOAAgreement({
          ...organization,
          //@ts-ignore
          fund_manager: fundManager?.passport.name,
        });
      }

      if (organization.high_volume_partner && !mou) {
        waitingForGeneration = true;
        await createMOUAgreement(organization);
      }

      if (waitingForGeneration) continue;

      await triggerTransition({
        id: organization._id.toString(),
        action: "GENERATION_COMPLETE",
        phase: "generate-agreements",
      });
    }
  } catch (err: any) {
    console.error(err);
  }
};
