import type { SQSEvent } from "aws-lambda";
import { connectMongoose } from "@allocations/service-common";
import {
  Deal,
  Investment,
  InvestorPassport,
  SubscriptionTemplate,
} from "@allocations/core-models";
import { createSubscriptionAgreement } from "../../src/docspring";

interface InvestmentForDocspring extends Investment {
  deal: Deal      
  investor_type: string;
  investor_name: string;
  investor_entity_name: string | null;
  investor_country: string;
  investor_state: string;
  accredited_investor_type: string;
  investor_title: string;
}

export const handler = async ({ Records }: SQSEvent) => {
  try {
    await connectMongoose();

    for (const record of Records) {
      const { Message } = JSON.parse(record.body);
      const { _id } = JSON.parse(Message);

      const investment = await Investment.findById(_id).populate<{
        deal: Deal;
      }>("deal").lean();
      if (!investment) {
        throw new Error("Investment Not Found");
      }
      const passport = await InvestorPassport.findById(investment.passport_id).lean();
      if (!passport) {
        throw new Error("Passport Not Found");
      }
      const subscriptionTemplate = await SubscriptionTemplate.findById(
        investment.deal.subscription_agreement.docspring_base_template_id
      ).lean();
      if (!subscriptionTemplate) {
        throw new Error("Missing SubscriptionTemplate");
      }

      await createSubscriptionAgreement(
        {
        ...investment,
        investor_type: passport.type,
        investor_name:
          passport.type === "Entity"
            ? passport.representative!
            : passport.name!,
        investor_entity_name:
          passport.type === "Entity" ? passport.name : null,
        investor_country: passport.country!,
        investor_state: passport.us_state || '',
        accredited_investor_type: passport.accreditation_type,
        investor_title: passport.title,
      } as InvestmentForDocspring, 
        subscriptionTemplate)
    }
  } catch (err: any) {
    console.error(err);
  }
};