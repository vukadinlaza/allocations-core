import { Router } from "express";
import { Deal, DealPhase, Document } from "@allocations/core-models";
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
const fileName = basename(__filename, ".ts");
const log = logger.child({ module: fileName });

const getSetupCost = (deal: Deal) => {
  const isMicro =
    deal.type === "spv" &&
    deal.asset_type === "Startup" &&
    deal.target_raise_goal <= 99999 &&
    !deal.side_letters;

  if (isMicro) return 3500;
  if (deal.type === "fund") {
    return deal.number_of_investments >= 30 ? 15000 : 26000;
  } else if (deal.type === "acquisition") return 12000;
  else if (deal.asset_type !== "Startup" || deal.custom_investment_agreement)
    return 14000;
  else if (deal.asset_type === "Startup") return 8000;
  else return 10000;
};

const getAdviserFee = (deal: Deal) => {
  const calculateAdviserFee = (deal: Deal): number => {
    if (deal.type === "fund") return 2000;
    if (deal.asset_type !== "Startup") {
      if (deal.target_raise_goal <= 100000) return 2000;
      if (100001 <= deal.target_raise_goal && deal.target_raise_goal <= 250000)
        return 4000;
      if (250001 <= deal.target_raise_goal && deal.target_raise_goal <= 500000)
        return 8000;
      if (500001 <= deal.target_raise_goal && deal.target_raise_goal <= 1000000)
        return 18000;
      if (1000001 <= deal.target_raise_goal) return 50000;
    }

    return 2000;
  };

  const isMicro =
    deal.type === "spv" &&
    deal.asset_type === "Startup" &&
    deal.target_raise_goal <= 99999 &&
    !deal.side_letters;

  if (isMicro) return 1000;

  if (deal.type === "fund") {
    return deal.number_of_investments >= 30 ? 1500 : 2000;
  }
  return deal.reporting_adviser === "Sharding Advisers LLC" ||
    !deal.reporting_adviser
    ? calculateAdviserFee(deal)
    : 0;
};

export default Router()
  .post("/", async (req, res, next) => {
    const { new_hvp = false, promo_code } = req.body;
    try {
      // adding options as the field 'organization_ids' does not exist on current schema
      const entityV1 = await Entity.findOne(
        {
          organization_ids: req.body.deal.organization_id,
        },
        null,
        { strictQuery: false }
      );

      const entityV2 = await Entity.findOne({
        organization_id: req.body.deal.organization_id,
      });

      if (!entityV1 || !entityV2) {
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
            entityV1?._id ||
            entityV2?._id ||
            new mongoose.Types.ObjectId(process.env.ATOMIZER_ID),
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
  });
