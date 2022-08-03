import type { SQSEvent } from "aws-lambda";
import { connectMongoose } from "@allocations/service-common";
import {
  Deal,
  Investment,
  SubscriptionTemplate,
} from "@allocations/core-models";
import { createSubscriptionAgreement } from "../../src/docspring";

export const handler = async ({ Records }: SQSEvent) => {
  try {
    await connectMongoose();

    for (const record of Records) {
      const { Message } = JSON.parse(record.body);
      const { _id } = JSON.parse(Message);

      const investment = await Investment.findById(_id).populate<{
        deal: Deal;
      }>("deal");
      if (!investment) {
        throw new Error("Investment Not Found");
      }
      const subscriptionTemplate = await SubscriptionTemplate.findOne({
        template_id:
          investment.deal.subscription_agreement.docspring_base_template_id,
      });
      if (!subscriptionTemplate) {
        throw new Error("Missing SubscriptionTemplate");
      }

      await createSubscriptionAgreement(investment, subscriptionTemplate);
    }
  } catch (err: any) {
    console.error(err);
  }
};
