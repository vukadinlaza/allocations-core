import type { SQSEvent } from "aws-lambda";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import { StripeAccount } from "@allocations/core-models";
import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: "2022-08-01",
});

export const handler = async ({ Records }: SQSEvent) => {
  await connectMongoose();

  for (const record of Records) {
    try {
      const { Message } = JSON.parse(record.body);
      const account = StripeAccount.hydrate(JSON.parse(Message));

      const stripeAccount = await stripe.accounts.retrieve(
        account.stripe_account_id
      );

      if (!stripeAccount.charges_enabled) continue;

      await triggerTransition({
        id: account._id.toString(),
        action: "CHARGES_ENABLED",
        phase: "verification-pending",
      });
    } catch (err: any) {
      console.error(err);
    }
  }
};
