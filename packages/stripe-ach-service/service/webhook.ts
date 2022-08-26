import {
  LambdaEvent,
  connectMongoose,
  sendError,
  send,
} from "@allocations/service-common";
import { Stripe } from "stripe";
import {
  handleAccountUpdated,
  handlePaymentIntentFailed,
  handlePaymentIntentProcessing,
  handlePaymentIntentSucceeded,
  handlePayoutCreated,
  handlePayoutFailed,
  handlePayoutPaid,
} from "../src/stripe-handlers";

const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: "2022-08-01",
});

const handlers: { [key: string]: (obj: any) => Promise<void> } = {
  "account.updated": handleAccountUpdated,
  "payment_intent.precessing": handlePaymentIntentProcessing,
  "payment_intent.payment_failed": handlePaymentIntentFailed,
  "payment_intent.succeeded": handlePaymentIntentSucceeded,
  "payout.created": handlePayoutCreated,
  "payout.failed": handlePayoutFailed,
  "payout.paid": handlePayoutPaid,
};

export const handler = async (event: LambdaEvent) => {
  try {
    await connectMongoose();

    const stripeEvent = stripe.webhooks.constructEvent(
      event.body as string,
      event.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    await handlers[stripeEvent.type]?.(stripeEvent.data.object);

    return send({ acknowledged: true });
  } catch (err: any) {
    return sendError({ error: err, status: err.status });
  }
};
