import { Router, Request } from "express";
import {
  Investment,
  InvestorPassport,
  Transaction,
} from "@allocations/core-models";
import { S3Client } from "@aws-sdk/client-s3";
import {
  initialize,
  resign,
  resyncWithAirtable,
  update,
} from "../../utils/investments";
import { HttpError } from "@allocations/api-common";
import _ from "lodash";
import { addLinkToDocuments, getFromBuild } from "../../utils/helpers";
import { Deal } from "@allocations/core-models";
import mongoose from "mongoose";

interface GeneralObject {
  [key: string]: any;
}

type LinkTransactionRequestBody = {
  readonly committed_amount: boolean;
  readonly is_crypto: boolean;
  readonly ommitted_amount: number;
  readonly treasury_transaction_id: string;
  readonly wired_amount: number;
  readonly wired_date: string;
};

const client = new S3Client({ region: "us-east-1" });

export default Router()
  .post("/", async (req, res, next) => {
    try {
      const { submission_data, ...rest } = req.body;
      const investment = await Investment.create({
        ...rest,
        ...submission_data,
        phase: "new",
      });

      res.send(investment);

      await initialize(investment, req.headers["x-api-token"] as string);
    } catch (e) {
      next(e);
    }
  })

  .patch("/", async (req, res, next) => {
    try {
      res.send(await Investment.updateMany(req.query, req.body, { new: true }));
    } catch (e) {
      next(e);
    }
  })

  .patch("/:id", async (req, res, next) => {
    try {
      res.send(
        await update(
          req.params.id,
          req.body,
          req.headers["x-api-token"] as string
        )
      );
    } catch (e) {
      next(e);
    }
  })

  .patch(
    "/:id/link-transaction",
    async (
      // eslint-disable-next-line @typescript-eslint/ban-types
      req: Request<{ id: string }, {}, LinkTransactionRequestBody, {}>,
      res,
      next
    ) => {
      try {
        if (_.isEmpty(req.body)) {
          throw new Error("Request body is required");
        }
        const {
          committed_amount,
          is_crypto,
          treasury_transaction_id,
          wired_date,
          wired_amount,
        } = req.body;
        const { id } = req.params;

        // Check whether a matching investment exists!
        const originalInvestment = await Investment.findById(id);
        if (!originalInvestment) {
          throw new Error(`Could not find investment ${id} to update`);
        }

        // Create a Transaction document with data from incoming treasury txn
        const newTransaction = await Transaction.create({
          committed_amount,
          is_crypto,
          treasury_transaction_id,
          wired_date,
          wired_amount,
        });

        if (!newTransaction) {
          throw Error(
            `Creating Transaction for investment ${id} failed. Transaction not linked.`
          );
        }

        // Update the investment with the new transaction
        const updatedInvestment = await Investment.findByIdAndUpdate(
          id,
          { $push: { transactions: newTransaction }, phase: "wired" },
          { new: true }
          // I don't think we need a callback here
        );

        if (
          !updatedInvestment ||
          updatedInvestment?.transactions.length ===
            originalInvestment.transactions.length
        ) {
          throw new Error(
            `Could not link new Transaction: ${newTransaction._id} with Investment: ${originalInvestment._id}`
          );
        }
        res.send({
          updated: true,
          invest_transaction_id: newTransaction._id,
          investment_id: id,
        });
      } catch (e: any) {
        next(e);
      }
    }
  )

  .post("/:id/resign", async (req, res, next) => {
    try {
      const investment = await Investment.findOneAndUpdate(
        { _id: req.params.id, phase: ["wire-pending", "signed"] },
        {
          ...req.body,
          phase: "signed",
        },
        { new: true }
      );
      if (!investment) {
        throw new HttpError("Investment not available to resign", 400);
      }

      res.send(investment);

      await resign(investment, req.headers["x-api-token"] as string);
    } catch (e) {
      next(e);
    }
  })

  .post("/:id/resync", async (req, res, next) => {
    try {
      const investment = await Investment.findById(req.params.id);
      if (!investment) {
        throw new HttpError("Not Found", 404);
      }

      await resyncWithAirtable(
        investment,
        req.headers["x-api-token"] as string
      );

      res.send({ acknowledged: true });
    } catch (e) {
      next(e);
    }
  })

  .get("/", async (req, res, next) => {
    try {
      const investments = await Investment.find(req.query);
      res.send(investments);
    } catch (e) {
      next(e);
    }
  })

  .get("/investment-by-id/:id", async (req, res, next) => {
    try {
      res.send(await Investment.findById(req.params.id));
    } catch (e) {
      next(e);
    }
  })

  .get("/investments-by-user/:user_id", async (req, res, next) => {
    try {
      const investments = await Investment.aggregate([
        {
          $match: { user_id: new mongoose.Types.ObjectId(req.params.user_id) },
        },
        {
          $lookup: {
            from: "documents",
            localField: "_id",
            foreignField: "investment_id",
            as: "documents",
          },
        },
      ]);

      const query = `?${investments
        .filter((investment) => investment?.metadata?.deal_id)
        .map((investment) => (investment.metadata as GeneralObject).deal_id)
        .join("&_id[]=")}`;

      const dealsRes = await getFromBuild(
        req.headers["x-api-token"] as string,
        `/api/v1/deals?${query}`
      );
      const deals = await dealsRes.json();

      const response = await Promise.all(
        investments.map(async (investment) => {
          const deal = deals.find(
            (deal: Deal) =>
              deal._id === (investment?.metadata as GeneralObject)?.deal_id
          );
          const documents = await addLinkToDocuments(
            investment.documents,
            client
          );

          return {
            ...investment,
            deal,
            documents,
          };
        })
      );
      res.send(await response);
    } catch (e) {
      next(e);
    }
  })

  .get("/:id", async (req, res, next) => {
    try {
      const investmentResult = await Investment.aggregate([
        {
          $match: { _id: new mongoose.Types.ObjectId(req.params.id) },
        },
        {
          $lookup: {
            from: "documents",
            localField: "_id",
            foreignField: "investment_id",
            as: "documents",
          },
        },
      ]);

      if (!investmentResult?.length) throw new Error("No investment found");

      const investment = investmentResult[0];

      const dealRes = await getFromBuild(
        req.headers["x-api-token"] as string,
        `/api/v1/deals?_id=${(investment?.metadata as any)?.deal_id}`
      );
      const deal = await dealRes.json();

      if (!deal?.length) throw new Error("No deal found");

      const documents = await addLinkToDocuments(investment.documents, client);

      res.send({ ...investment, deal: deal[0], documents });
    } catch (e) {
      next(e);
    }
  })

  .post("/investment-agreement-preview", async (_, res, next) => {
    try {
      res.send({});
    } catch (e) {
      next(e);
    }
  })
  .post("/migration", async (req, res, next) => {
    try {
      const { investments } = req.body;
      const newInvestments = await Investment.create(investments);
      res.send(newInvestments);
    } catch (e) {
      next(e);
    }
  })

  .delete("/migration/:migration_airtable_id", async (req, res, next) => {
    try {
      const deletedInvestment = await Investment.findOneAndDelete({
        "metadata.migration_airtable_id": req.params.migration_airtable_id,
      });
      res.send(deletedInvestment);
    } catch (e) {
      next(e);
    }
  })

  .delete("/:id", async (req, res, next) => {
    try {
      const deletedInvestment = await Investment.findByIdAndUpdate(
        req.params.id,
        { phase: "archived" }
      );

      if (!deletedInvestment) {
        throw new HttpError("No investment found", 404);
      }
      res.send({ acknowledged: true });
    } catch (e) {
      next(e);
    }
  });
