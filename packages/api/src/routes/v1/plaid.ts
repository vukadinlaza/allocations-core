import { HttpError } from "@allocations/api-common";
import {
  DealPhase,
  PlaidAccount,
  PlaidTransaction,
} from "@allocations/core-models";
import { Router } from "express";
import {
  Configuration,
  PlaidEnvironments,
  PlaidApi,
  Products,
  DepositoryAccountSubtype,
  CountryCode,
} from "plaid";
import { initializePlaidAccount } from "../../services/plaid";

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENVIRONMENT!],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

export default Router()
  .post("/link", async (req, res, next) => {
    try {
      const { data } = await client.linkTokenCreate({
        client_name: "Allocations Banking Link",
        language: "en",
        country_codes: [CountryCode.Us],
        webhook: `${process.env.PLAID_WEBHOOK_URL}/webhook/${req.body.deal_id}`,
        user: {
          client_user_id: req.body.deal_id,
        },
        products: [Products.Transactions],
        account_filters: {
          depository: {
            account_subtypes: [DepositoryAccountSubtype.Checking],
          },
        },
      });

      res.send(data);
    } catch (e) {
      next(e);
    }
  })

  .post("/exchange", async (req, res, next) => {
    try {
      const { data } = await client.itemPublicTokenExchange({
        public_token: req.body.public_token,
      });

      const { data: auth } = await client.authGet({
        access_token: data.access_token,
      });

      const account = await PlaidAccount.create({
        phase: "new",
        deal_id: req.body.deal_id,
        plaid_item_id: data.item_id,
        access_token: data.access_token,
        account_name: auth.accounts[0].name,
        account_number: auth.numbers.ach[0].account,
        routing_number:
          auth.numbers.ach[0].wire_routing || auth.numbers.ach[0].routing,
      });

      res.send(account);

      await Promise.all([
        initializePlaidAccount(account, req.headers["x-api-token"] as string),
        DealPhase.findOneAndUpdate(
          {
            deal_id: req.body.deal_id,
            "tasks.title": "Bank Account Creation",
          },
          { "tasks.$.complete": true }
        ),
      ]);
    } catch (e) {
      next(e);
    }
  })

  .get("/", async (req, res, next) => {
    try {
      res.send(await PlaidAccount.find(req.query));
    } catch (e) {
      next(e);
    }
  })

  .get("/transactions", async (req, res, next) => {
    try {
      res.send(
        await PlaidTransaction.find(req.query).populate({
          path: "plaid_account",
          justOne: true,
          populate: { path: "deal_id", justOne: true },
        })
      );
    } catch (e) {
      next(e);
    }
  })

  .post("/reconcile", async (req, res, next) => {
    try {
      const transaction = await PlaidTransaction.findByIdAndUpdate(
        req.body.transaction_id,
        { category: req.body.category, investment_id: req.body.investment_id },
        { new: true }
      );

      if (!transaction) {
        throw new HttpError("Transaction Not Found", 404);
      }

      res.send(transaction);
    } catch (e) {
      next(e);
    }
  })

  .get("/:id", async (req, res, next) => {
    try {
      const account = await PlaidAccount.findById(req.params.id);
      if (!account) {
        throw new HttpError("PlaidAccount Not Found", 404);
      }

      res.send(account);
    } catch (e) {
      next(e);
    }
  })

  .get("/:id/transactions", async (req, res, next) => {
    try {
      res.send(
        await PlaidTransaction.find({ plaid_account: req.params.id }).populate({
          path: "plaid_account",
          justOne: true,
          populate: { path: "deal_id", justOne: true },
        })
      );
    } catch (e) {
      next(e);
    }
  })

  .patch("/:id", async (req, res, next) => {
    try {
      res.send(
        await PlaidAccount.findByIdAndUpdate(req.params.id, req.body, {
          new: true,
        })
      );
    } catch (e) {
      next(e);
    }
  })

  .delete("/:id", async (req, res, next) => {
    try {
      const transactions = await PlaidTransaction.find({
        plaid_account: req.params.id,
        $or: [
          { category: { $exists: true } },
          { investment_id: { $exists: true } },
        ],
      });

      if (transactions.length) {
        throw new HttpError(
          "Unable to delete account because transactions have already been reconciled",
          400
        );
      }

      await Promise.all([
        PlaidAccount.findByIdAndDelete(req.params.id),
        PlaidTransaction.deleteMany({ plaid_account: req.params.id }),
      ]);

      res.send({ acknowledged: true });
    } catch (e) {
      next(e);
    }
  });
