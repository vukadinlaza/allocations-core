import { Router } from "express";
import {
  Investment,
  InvestorPassport,
  PassportUser,
} from "@allocations/core-models";
import { S3Client } from "@aws-sdk/client-s3";
import { resign, resyncWithAirtable, update } from "../../utils/investments";
import { HttpError } from "@allocations/api-common";
import _ from "lodash";
import { addLinkToDocuments, getFromBuild } from "../../utils/helpers";
import { Deal } from "@allocations/core-models";
import mongoose from "mongoose";
import { initializePassport } from "../../services/passports";
import { initializeInvestment } from "../../services/investmentsV2";

interface GeneralObject {
  [key: string]: any;
}

const client = new S3Client({ region: "us-east-1" });

export default Router()
  .post("/", async (req, res, next) => {
    try {
      const { submission_data, ...rest } = req.body;
      const passportBody = {
        type:
          rest.investor_type?.toLowerCase() === "entity"
            ? "Entity"
            : "Individual",
        title: rest.title || null,
        name: rest.investor_entity_name || rest.investor_name,
        representative: rest.investor_name,
        country: rest.investor_country,
        us_state: rest.investor_state,
        accreditation_type: rest.accredited_investor_type,
      };

      let passportUser = await PassportUser.findOne({
        user_id: rest.user_id,
      }).populate<{ passport_id: InvestorPassport }>("passport_id");

      let passport = passportUser?.passport_id || null;

      if (!passport) {
        passport = await InvestorPassport.create({
          ...passportBody,
          phase: "new",
        });

        await initializePassport(
          passport,
          req.headers["x-api-token"] as string
        );
        await PassportUser.create({
          passport_id: passport._id,
          user_id: rest.user_id,
          role: "admin",
        });
      }

      const investment = await Investment.create({
        ...rest,
        passport_id: passport._id,
        metadata: {
          submission_data,
        },
        phase: "new",
      });

      res.send(investment);

      await initializeInvestment(
        investment,
        req.headers["x-api-token"] as string
      );
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
