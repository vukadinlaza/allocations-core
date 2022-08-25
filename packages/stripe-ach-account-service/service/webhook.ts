import { StripeAccount } from "@allocations/core-models";
import {
  LambdaEvent,
  connectMongoose,
  sendError,
  HttpError,
  triggerTransition,
  send,
} from "@allocations/service-common";
import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: "2022-08-01",
});

export const handler = async (event: LambdaEvent) => {
  try {
    await connectMongoose();

    const stripeEvent = stripe.webhooks.constructEvent(
      event.body as string,
      event.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (stripeEvent.type !== "account.updated") {
      return send({ acknowledged: true });
    }

    const stripeAccount = stripeEvent.data.object as {
      id: string;
      requirements: { errors: string[] };
      capabilities: {
        us_bank_account_ach_payments: "active" | "inactive" | "pending";
      };
      details_submitted: boolean;
      charges_enabled: boolean;
      payouts_enabled: boolean;
    };

    const account = await StripeAccount.findOne({
      stripe_account_id: stripeAccount.id,
    });
    if (!account) {
      throw new HttpError("Account Not Found", "404");
    }

    let action;
    if (stripeAccount.requirements.errors.length) {
      action = "FAILED";
    } else if (
      stripeAccount.details_submitted &&
      stripeAccount.charges_enabled &&
      stripeAccount.payouts_enabled &&
      stripeAccount.capabilities.us_bank_account_ach_payments === "active"
    ) {
      action = "VERIFICATION_COMPLETE";
    } else if (stripeAccount.details_submitted) {
      action = "DETAILS_SUBMITTED";
    }

    if (action) {
      await triggerTransition({
        id: account._id.toString(),
        action,
        phase: account.phase,
      });
    }

    return send({ acknowledged: true });
  } catch (err: any) {
    return sendError({ error: err, status: err.status });
  }
};
