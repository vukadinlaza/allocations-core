import { Router } from "express";
import { Deal, DealPhase, Document } from "@allocations/core-models";
import {
  userAcknowledgedComplete,
  inviteInvestorsTaskComplete,
  signInvestmentAgreement,
} from "../../utils/deals";
import { HttpError } from "@allocations/api-common";
import { Entity } from "@allocations/core-models";
import mongoose from "mongoose";
import logger from "../../../logger";
import { basename } from "path";
import {
  getDataRequestToken,
  createSubscriptionAgreementDataRequest,
  getDocspringEnvironment,
} from "../../utils/docspring";
import { ObjectId } from "mongodb";
const fileName = basename(__filename, ".ts");
const log = logger().child({ module: fileName });

const getSetupCost = (deal: Deal) => {
  if (deal.type === "fund") {
    return deal.number_of_investments >= 30 ? 15000 : 26000;
  } else if (deal.type === "acquisition") return 12000;
  else if (deal.asset_type === "Real Estate") return 15000;
  else if (
    deal.asset_type === "Secondary" ||
    deal.asset_type === "Instant" ||
    deal.asset_type === "SPV into an SPV" ||
    deal.asset_type === "SPV into a Fund"
  )
    return 10000;
  else if (deal.asset_type === "Startup" || deal.type === "spv") return 8000;
  else return 10000;
};

const getAdviserFee = (deal: Deal) => {
  if (deal.type === "fund") {
    return deal.number_of_investments >= 30 ? 1500 : 2000;
  }
  return deal.reporting_adviser === "Sharding Advisers LLC" ||
    !deal.reporting_adviser
    ? 2000
    : 0;
};

export default Router()
  .post("/", async (req, res, next) => {
    const { new_hvp = false, promo_code } = req.body;
    try {
      const entity = await Entity.findOne({
        organization_ids: req.body.deal.organization_id,
      });

      // // Associated the selected org with atomizer
      if (!entity) {
        await Entity.findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(process.env.ATOMIZER_ID) },
          { $push: { organization_ids: req.body.deal.organization_id } }
        );
      }

      const { deal, phases } = await Deal.createWithPhases(
        {
          metadata: {
            special_terms: [
              {
                term: "Bluesky Fees",
                fee: "TBD",
                quantity: "TBD",
                total: "TBD",
              },
              {
                term: "Over 35 Investors",
                fee: "$100 each",
                quantity: "TBD",
                total: "TBD",
              },
            ],
            ...(req.body.deal.metadata || {}),
          },
          ...req.body.deal,
          master_entity_id:
            entity?._id || new mongoose.Types.ObjectId(process.env.ATOMIZER_ID),
          setup_cost: getSetupCost(req.body.deal) + promo_code,
          reporting_adviser_fee: getAdviserFee(req.body.deal),
          phase: "new",
        },
        new_hvp
      );

      await Document.findOneAndUpdate(
        {
          organization_id: deal.organization_id,
          "metadata.deal_id": { $exists: false },
          title: { $regex: "Memorandum Of Understanding" },
        },
        {
          "metadata.deal_id": deal._id,
        }
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
              $match: {
                phase: {
                  $ne: "archived",
                },
              },
            },
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
  });