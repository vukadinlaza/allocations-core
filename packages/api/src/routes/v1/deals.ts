import { Router } from "express";
import {
  Deal,
  DealPhase,
  Document,
  Investment,
  PlaidAccount,
  PlaidTransaction,
} from "@allocations/core-models";
import {
  userAcknowledgedComplete,
  inviteInvestorsTaskComplete,
  signInvestmentAgreement,
} from "../../utils/deals";
import { HttpError, logger } from "@allocations/api-common";
import { Entity } from "@allocations/core-models";
import mongoose from "mongoose";
import { basename } from "path";
import {
  getDataRequestToken,
  createSubscriptionAgreementDataRequest,
  getDocspringEnvironment,
} from "../../utils/docspring";
import { ObjectId } from "mongodb";
import {
  getAdviserFee,
  getSetupCost,
  investorFeeMap,
} from "../../utils/pricing";
import { findNonAllocationsV1Entity } from "../../utils/entities";
import fetch from "node-fetch";
import {
  createDealRecord,
  findDealRecord,
} from "../../utils/airtable/deal-tracker";
const fileName = basename(__filename, ".ts");
const log = logger.child({ module: fileName });

export default Router()
  .post("/", async (req, res, next) => {
    const { new_hvp = false, promo_code } = req.body;
    try {
      const entityV1 = await findNonAllocationsV1Entity(
        req.body.deal.organization_id
      );

      const entityV2 = await Entity.findOne({
        organization_id: req.body.deal.organization_id,
      });

      if (!entityV1 && !entityV2) {
        await Entity.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(process.env.ATOMIZER_ID) },
          { $push: { organization_ids: req.body.deal.organization_id } }
        );
      }

      const { deal, phases } = await Deal.createWithPhases(
        {
          ...req.body.deal,
          master_entity_id:
            entityV2?._id ||
            entityV1?._id ||
            new mongoose.Types.ObjectId(process.env.ATOMIZER_ID),
          setup_cost: getSetupCost(req.body.deal) + promo_code,
          reporting_adviser_fee: getAdviserFee(req.body.deal),
          phase: "new",
          metadata: {
            show_progress: false,
            show_deal_crypto_disclaimer: false,
            special_terms: [
              {
                term: "Bluesky Fees",
                fee: "TBD",
                quantity: "TBD",
                total: "TBD",
              },
              {
                term:
                  investorFeeMap[req.body.deal.asset_type as string] ||
                  investorFeeMap["default"],
                fee: "$100 each",
                quantity: "TBD",
                total: "TBD",
              },
            ],
          },
        },
        new_hvp
      );

      res.send({ deal, phases });

      await Deal.initialize(deal._id, req.headers["x-api-token"] as string);
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  // purpose of the route to be able to create a deal without phases
  .post("/migration", async (req, res, next) => {
    try {
      const newDeal = await Deal.create({ ...req.body, phase: "closed" });
      res.send(newDeal);
    } catch (e) {
      next(e);
    }
  })

  .get("/", async (req, res, next) => {
    try {
      const deals = await Deal.find(req.query).populate([
        "master_entity_id",
        "organization_id",
      ]);

      res.send(deals);
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  .get("/totals", async (_, res, next) => {
    try {
      res.send(
        (
          await Deal.aggregate([
            {
              $group: {
                _id: "$phase",
                count: {
                  $sum: 1,
                },
              },
            },
            {
              $group: {
                _id: null,
                counts: {
                  $addToSet: {
                    phase: "$_id",
                    count: "$count",
                  },
                },
                total: {
                  $sum: "$count",
                },
              },
            },
          ])
        )[0]
      );
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  .get("/:id", async (req, res, next) => {
    try {
      const deal = await Deal.findById(req.params.id).populate("phases");
      res.send(deal);
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  .get("/deal-tracker/:id", async (req, res, next) => {
    try {
      const response = await fetch(
        `${process.env.INVEST_API!}/api/v1/investments?metadata.deal_id=${
          req.params.id
        }`,
        {
          method: "GET",
          headers: {
            "X-API-TOKEN": req.headers["x-api-token"] as string,
          },
        }
      );

      const v1Investments = await response.json();

      const mungedInvestments = await Promise.all(
        v1Investments.map(async (inv: any) => {
          const plaidTransactions: PlaidTransaction[] =
            await PlaidTransaction.find({
              investment_id: inv._id,
            });

          let bank_account_name: string | undefined;
          if (plaidTransactions[0]) {
            const plaidAccount = await PlaidAccount.findById(
              plaidTransactions[0].plaid_account
            );
            bank_account_name = plaidAccount?.account_name;
          }

          const usd = plaidTransactions.reduce(
            (acc, curr) => (acc += curr.amount),
            0
          );

          return { ...inv, usd, bank_account_name };
        })
      );

      const investments = await Investment.aggregate([
        {
          $match: { deal_id: new ObjectId(req.params.id) },
        },
        {
          $lookup: {
            from: "plaidaccounts",
            localField: "deal_id",
            foreignField: "deal_id",
            as: "bank_account_name",
          },
        },
        {
          $set: {
            bank_account_name: {
              $arrayElemAt: ["$bank_account_name.account_name", 0],
            },
          },
        },
        {
          $lookup: {
            from: "plaidtransactions",
            localField: "_id",
            foreignField: "investment_id",
            as: "plaid_transaction",
          },
        },
        {
          $unwind: {
            path: "$plaid_transaction",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$_id",
            usd: { $sum: "$plaid_transaction.amount" },
            doc: { $first: "$$ROOT" },
          },
        },
        {
          $replaceRoot: {
            newRoot: { $mergeObjects: [{ usd: "$usd" }, "$doc"] },
          },
        },
        {
          $unset: "plaid_transaction",
        },
        {
          $lookup: {
            from: "deals",
            localField: "deal_id",
            foreignField: "_id",
            as: "deal",
          },
        },
        { $unwind: "$deal" },
        {
          $lookup: {
            from: "investorpassports",
            localField: "passport_id",
            foreignField: "_id",
            as: "passport",
          },
        },
        { $unwind: { path: "$passport", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "passportusers",
            localField: "passport_id",
            foreignField: "passport_id",
            as: "passport_user",
          },
        },
        {
          $set: {
            user_id: {
              $arrayElemAt: ["$passport_user.user_id", 0],
            },
          },
        },
        {
          $unset: "passport_user",
        },
        {
          $lookup: {
            from: "cryptotransactions",
            localField: "_id",
            foreignField: "investment_id",
            as: "crypto_transaction",
          },
        },
        {
          $unwind: {
            path: "$crypto_transaction",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: "$_id",
            usdc: { $sum: "$crypto_transaction.transaction_amount" },
            etherscan_receipt: {
              $accumulator: {
                accumulateArgs: [
                  "$crypto_transaction.metadata.coinbase_transaction_hash",
                ],
                init: function () {
                  return [];
                },
                accumulate: function (ids: string[], id: string) {
                  return ids.concat(id);
                },
                merge: function (ids1: string[], ids2: string[]) {
                  return ids1.concat(ids2);
                },
                finalize: function (ids: string[]) {
                  return (
                    ids.filter((element) => element != null).join(",") || null
                  );
                },
                lang: "js",
              },
            },
            doc: { $first: "$$ROOT" },
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: [
                { usdc: "$usdc", etherscan_receipt: "$etherscan_receipt" },
                "$doc",
              ],
            },
          },
        },
        {
          $unset: "crypto_transaction",
        },
      ]);

      const map: { [key: string]: boolean } = {};
      const investmentsWithoutDuplicates = [
        ...investments,
        ...mungedInvestments,
      ].reduce((acc, curr) => {
        if (map[curr._id]) {
          return acc;
        }
        map[curr._id] = true;
        return [...acc, curr];
      }, []);

      res.send(investmentsWithoutDuplicates);
    } catch (e) {
      next(e);
    }
  })

  .post("/sign-investment-agreement/:id", async (req, res, next) => {
    try {
      const deal_id = req.params.id;
      await signInvestmentAgreement(
        deal_id,
        req.headers["x-api-token"] as string
      );
      res.send({ message: "User successfully signed investment agreement." });
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  .put("/:id", async (req, res, next) => {
    try {
      if (req.body.master_entity_id) {
        req.body.master_entity_id = new ObjectId(req.body.master_entity_id);
      }

      const deal = await Deal.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });

      if (!deal)
        throw new HttpError(
          `Deal with id ${req.params.id} does not exist`,
          404
        );

      // probably need a better way to check this
      if (req.body.master_entity_id) {
        // checks to see if the entity is already in the organization's admin array
        const entity = await Entity.findOne({
          _id: req.body.master_entity_id,
          organization_ids: deal?.organization_id,
        });

        if (!entity) {
          // if the entity is not associated with the organization, update the entity
          await Entity.findByIdAndUpdate(req.body.master_entity_id, {
            $push: { organization_ids: deal.organization_id },
          });
        }
      }

      res.send(deal);
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  .post("/user-acknowledged-complete/:id", async (req, res, next) => {
    try {
      await userAcknowledgedComplete(
        req.params.id,
        req.headers["x-api-token"] as string
      );

      res.send({ message: "Successfully updated task." });
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  .post("/invite-investors-task-complete/:id", async (req, res, next) => {
    try {
      await inviteInvestorsTaskComplete(
        req.params.id,
        req.headers["x-api-token"] as string
      );

      res.send({ message: "Successfully updated task." });
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  .post("/subscription-agreement-task/:deal_id", async (req, res, next) => {
    const { deal_id } = req.params;
    try {
      const updatedPhase = await DealPhase.findOneAndUpdate(
        {
          deal_id,
          "tasks.title": "Drafting Subscription Documents",
        },
        {
          "tasks.$.complete": true,
        },
        { new: true }
      );
      if (!updatedPhase)
        throw new HttpError(
          "Phase not found with title: 'Drafting Subscription Documents'"
        );

      const phase = await DealPhase.findOneAndUpdate(
        {
          deal_id,
          "tasks.title": "Sign Subscription Agreement",
        },
        {
          "tasks.$.metadata.docspring_presign_template_id":
            req.body.presign_template_id,
        },
        { new: true }
      );
      if (!phase)
        throw new HttpError(
          "Phase not found with title: 'Sign Subscription Agreement'"
        );

      res.send({ success: true });
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  .post("/set-task-complete/:task_id", async (req, res, next) => {
    const { task_id } = req.params;

    try {
      const phase = await DealPhase.findOneAndUpdate(
        {
          "tasks._id": task_id,
        },
        { "tasks.$.complete": !!req.body.complete },
        { new: true }
      );
      if (!phase) throw new HttpError("Phase not found");

      res.send({ success: true });
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  .post("/add-upload-id-task", async (req, res, next) => {
    const { deal_id } = req.body;

    try {
      const uploadTask = await DealPhase.findOne({
        deal_id,
        name: "pre-onboarding",
        "tasks.title": "Upload ID or Passport",
      });
      if (uploadTask) return res.send("Task already exists");

      const phase = await DealPhase.findOneAndUpdate(
        {
          deal_id,
          name: "pre-onboarding",
        },
        {
          $push: {
            //@ts-ignore
            tasks: {
              title: "Upload ID or Passport",
              type: "fm-document-upload",
              required: false,
              metadata: {
                //@ts-ignore
                tooltip_title: "ID/Passport Upload",
                tooltip_content: `<ul>
                 <li>Ensure the ID/passport is laying flat on the surface</li>
                 <li>All corners are clearly visible</li>
                 <li>Allow at least 1" around all the edges</li>
                 <li>*If passport, include the top and bottom portions</li>
                 </ul>`,
              },
            },
          },
        },
        {
          new: true,
        }
      );

      if (!phase) throw new HttpError("Unable to update phase");

      res.send({ success: true });
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  .get("/get-pre-signing-token/:id", async (req, res, next) => {
    try {
      const deal = await Deal.findById(req.params.id);
      if (!deal)
        throw new HttpError(`No deal with id ${req.params.id} found`, 404);
      const { submission } = await createSubscriptionAgreementDataRequest(deal);
      await Document.create({
        deal_id: deal._id,
        bucket: process.env.DOCUMENTS_BUCKET,
        complete: false,
        content_type: "pdf",
        path: `subscription_agreements/presigned/${getDocspringEnvironment()}/${
          deal._id
        }/${submission.id}`,
        title: "Presigned Subscription Agreement",
        type: "fm-document",
      });
      if (submission?.data_requests[0]?.id) {
        const data_request = await getDataRequestToken(
          submission?.data_requests[0]?.id
        );
        res.send(data_request);
      }
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  .get("/:id/airtable", async (req, res, next) => {
    try {
      const deals = await findDealRecord(req.params.id);
      console.log(deals);
      res.send(deals);
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  .post("/airtable-sync", async (req, res, next) => {
    try {
      const response = await createDealRecord(req.body);
      res.send(response);
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  });
