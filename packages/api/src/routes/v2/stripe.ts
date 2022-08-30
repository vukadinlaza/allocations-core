import { HttpError } from "@allocations/api-common";
import {
  PlaidAccount,
  StripeAccount,
  StripePayout,
  StripeTransaction,
} from "@allocations/core-models";
import { Router } from "express";
import { Stripe } from "stripe";

const stripe = new Stripe(process.env.STRIPE_API_KEY!, {
  apiVersion: "2022-08-01",
});

export default Router()
  .post("/accounts", async (req, res, next) => {
    try {
      const plaidAccount = await PlaidAccount.findOne({
        deal_id: req.body.deal_id,
      });
      if (!plaidAccount) {
        throw new HttpError("Stripe connect requires a plaid connection", 400);
      }

      const existingAccount = await StripeAccount.findOne({
        deal_id: req.body.deal_id,
      });
      if (
        existingAccount?.phase === "verification-pending" ||
        existingAccount?.phase === "live"
      ) {
        throw new HttpError("StripeAccount already connected", 400);
      }

      let stripeAccount: Stripe.Response<Stripe.Account>;
      if (existingAccount) {
        stripeAccount = await stripe.accounts.retrieve(
          existingAccount.stripe_account_id
        );
      } else {
        stripeAccount = await stripe.accounts.create({
          country: "US",
          type: "express",
          capabilities: {
            us_bank_account_ach_payments: { requested: true },
            transfers: { requested: true },
          },
          business_type: "company",
          business_profile: {
            url: "https://allocations.com",
          },
          metadata: {
            deal_id: req.body.deal_id,
          },
          external_account: {
            object: "bank_account",
            country: "US",
            currency: "usd",
            routing_number: plaidAccount.routing_number,
            account_number: plaidAccount.account_number,
          },
        });
      }

      const [account, link] = await Promise.all([
        StripeAccount.findOneAndUpdate(
          { deal_id: req.body.deal_id },
          {
            phase: "connect-pending",
            deal_id: req.body.deal_id,
            stripe_account_id: stripeAccount.id,
            stripe_external_account_id:
              stripeAccount.external_accounts?.data[0].id,
          },
          { upsert: true, new: true }
        ),
        stripe.accountLinks.create({
          account: stripeAccount.id,
          refresh_url: req.body.refresh_url ?? req.body.return_url,
          return_url: req.body.return_url,
          type: "account_onboarding",
        }),
      ]);

      res.send({ account, link });
    } catch (e) {
      next(e);
    }
  })

  .post("/transactions", async (req, res, next) => {
    try {
      const existingTransaction = await StripeTransaction.findOne({
        investment_id: req.body.investment_id,
      });
      if (existingTransaction?.phase !== "new") {
        throw new HttpError("Payment already processing or complete", 400);
      }
      if (existingTransaction) {
        const [transaction, intent] = await Promise.all([
          StripeTransaction.findByIdAndUpdate(existingTransaction._id, {
            amount: req.body.amount,
          }),
          stripe.paymentIntents.update(
            existingTransaction.stripe_payment_intent_id,
            {
              amount: req.body.amount * 100,
            }
          ),
        ]);
        return res.send({ transaction, client_secret: intent.client_secret });
      }

      const account = await StripeAccount.findOne({
        deal_id: req.body.deal_id,
      });
      if (!account) {
        throw new HttpError("Not StripeAccount connected to deal", 400);
      }

      const intent = await stripe.paymentIntents.create({
        amount: req.body.amount * 100,
        currency: "usd",
        confirmation_method: "automatic",
        payment_method: req.body.payment_method,
        payment_method_types: ["us_bank_account"],
        transfer_data: {
          destination: account.stripe_account_id,
        },
        metadata: {
          investment_id: req.body.investment_id,
          deal_id: req.body.deal_id,
        },
      });

      const transaction = await StripeTransaction.create({
        phase: "new",
        deal_id: req.body.deal_id,
        investment_id: req.body.investment_id,
        stripe_account_id: account._id,
        type: req.body.type || "initial-drawdown",
        stripe_payment_intent_id: intent.id,
        amount: req.body.amount,
      });

      res.send({ transaction, client_secret: intent.client_secret });
    } catch (e) {
      next(e);
    }
  })

  .get("/accounts", async (req, res, next) => {
    try {
      res.send(await StripeAccount.find(req.query));
    } catch (e) {
      next(e);
    }
  })

  .get("/transactions", async (req, res, next) => {
    try {
      res.send(await StripeTransaction.find(req.query));
    } catch (e) {
      next(e);
    }
  })

  .get("/payouts", async (req, res, next) => {
    try {
      res.send(await StripePayout.find(req.query));
    } catch (e) {
      next(e);
    }
  });
