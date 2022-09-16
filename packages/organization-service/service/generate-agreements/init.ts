import type { SQSEvent } from "aws-lambda";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import {
  Document,
  InvestorPassport,
  Organization,
  OrganizationAgreement,
  OrganizationFundManager,
  TaxInformation,
  W9TaxForm,
} from "@allocations/core-models";
import {
  createMOUAgreement,
  createPOAAgreement,
  createServicesAgreement,
  createTermsAgreement,
} from "../../utils/docspring";
import converter from "number-to-words";

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

      const organizationObject = organization.toObject();

      const orgWithFM = {
        ...organizationObject,
        fund_manager: fundManager?.passport.name,
      };

      const [terms, servicesAgreement, poa, mou, existingMOU] =
        await Promise.all([
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
          Document.findOne({ organization_id: organization._id }),
        ]);

      let waitingForGeneration = false;
      if (!terms) {
        waitingForGeneration = true;
        await createTermsAgreement(organization);
      }

      if (!servicesAgreement) {
        waitingForGeneration = true;
        //@ts-ignore
        await createServicesAgreement(fundManager ? orgWithFM : organization);
      }

      if (!poa) {
        waitingForGeneration = true;
        //@ts-ignore
        await createPOAAgreement(fundManager ? orgWithFM : organization);
      }

      if (organization.high_volume_partner && !mou && !existingMOU) {
        waitingForGeneration = true;
        const bankingManager = await OrganizationFundManager.findOne({
          organization_id: organization._id,
          role: "banking-manager",
        }).populate<{ passport: InvestorPassport }>("passport");

        if (!bankingManager) continue;

        const taxInformation = await TaxInformation.findOne({
          passport_id: bankingManager.passport_id,
        }).select("+signature_packet");

        if (!taxInformation) continue;
        const { tax_form, signature_packet } = taxInformation;

        const form = tax_form as W9TaxForm;

        const address = `${form.address}, ${form.city}, ${form.state} ${form.postal_code}`;

        const email = signature_packet?.signer_email || "";
        const number_of_deals_to_words = converter.toWords(
          organization.committed_number_of_deals
        );

        organizationObject.committed_number_of_deals = `(${organizationObject.committed_number_of_deals})`;

        //@ts-ignore
        await createMOUAgreement({
          ...organizationObject,
          address,
          email,
          number_of_deals_to_words,
        });
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
