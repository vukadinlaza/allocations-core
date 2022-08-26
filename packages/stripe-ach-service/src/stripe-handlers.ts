import {
  StripeAccount,
  StripeTransaction,
  StripePayout,
} from "@allocations/core-models";
import {
  HttpError,
  sendMessage,
  triggerTransition,
} from "@allocations/service-common";
import Stripe from "stripe";

export const handleAccountUpdated = async (stripeAccount: Stripe.Account) => {
  const account = await StripeAccount.findOne({
    stripe_account_id: stripeAccount.id,
  });
  if (!account) {
    throw new HttpError("Account Not Found", "404");
  }

  let action;
  if (stripeAccount.requirements?.errors?.length) {
    action = "FAILED";
  } else if (
    stripeAccount.details_submitted &&
    stripeAccount.charges_enabled &&
    stripeAccount.payouts_enabled &&
    stripeAccount.capabilities?.us_bank_account_ach_payments === "active"
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
};

export const handlePaymentIntentProcessing = async (
  paymentIntent: Stripe.PaymentIntent
) => {
  await StripeTransaction.findOneAndUpdate(
    {
      stripe_payment_intent_id: paymentIntent.id,
    },
    { phase: "processing" }
  );
};

export const handlePaymentIntentSucceeded = async (
  paymentIntent: Stripe.PaymentIntent
) => {
  const transaction = await StripeTransaction.findOneAndUpdate(
    {
      stripe_payment_intent_id: paymentIntent.id,
    },
    { phase: "succeeded" },
    { new: true }
  );

  if (transaction) {
    await sendMessage({
      id: transaction.investment_id.toString(),
      app: "core",
      service: "investment-v2",
      event: "reconcile",
      payload: {
        investment_id: transaction.investment_id,
        type: "ach",
      },
    });
  }
};

export const handlePaymentIntentFailed = async (
  paymentIntent: Stripe.PaymentIntent
) => {
  await StripeTransaction.findOneAndUpdate(
    {
      stripe_payment_intent_id: paymentIntent.id,
    },
    { phase: "failed" }
  );
};

export const handlePayoutCreated = async (payout: Stripe.Payout) => {
  const account = await StripeAccount.findOne({
    stripe_external_account_id: payout.destination,
  });
  if (!account) return;

  await StripePayout.create({
    phase: "created",
    stripe_account_id: account._id,
    deal_id: account?.deal_id,
    stripe_payout_id: payout.id,
    amount: payout.amount,
    arrival_date: payout.arrival_date,
  });
};

export const handlePayoutFailed = async (payout: Stripe.Payout) => {
  await StripePayout.findOneAndUpdate(
    {
      stripe_payout_id: payout.id,
    },
    {
      phase: "created",
      failure_message: payout.failure_message,
    }
  );
};

export const handlePayoutPaid = async (payout: Stripe.Payout) => {
  await StripePayout.findOneAndUpdate(
    {
      stripe_payout_id: payout.id,
    },
    {
      phase: "paid",
    }
  );
};
