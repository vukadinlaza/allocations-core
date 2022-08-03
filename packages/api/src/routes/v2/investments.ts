import { Router } from "express";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  Deal,
  Investment,
  InvestmentAgreement,
  InvestorPassport,
  TaxInformation,
  W9ETaxForm,
  W9TaxForm,
} from "@allocations/core-models";
import { HttpError } from "@allocations/api-common";
import {
  editInvestment,
  initializeInvestment,
} from "../../services/investmentsV2";

const client = new S3Client({ region: "us-east-1" });

export default Router()
  .post("/", async (req, res, next) => {
    try {
      const { passport_id, deal_id, ...rest } = req.body;
      if (!passport_id) {
        const investment = await Investment.findOneAndUpdate(
          {
            phase: "invited",
            deal_id,
            investor_email: rest.investor_email,
          },
          rest,
          { upsert: true, new: true }
        );
        res.send(investment);
      }

      const [deal, passport] = await Promise.all([
        Deal.findById(deal_id),
        InvestorPassport.findById(passport_id).populate<{
          tax_information: TaxInformation;
        }>("tax_information"),
      ]);
      if (!deal) {
        throw new HttpError("Invalid Deal", 400);
      }
      if (!passport) {
        throw new HttpError("Invalid InvestorPassport", 400);
      }

      const investment = await Investment.findOneAndUpdate(
        { phase: "invited", deal_id, investor_email: rest.investor_email },
        {
          ...rest,
          phase: "invited",
          investor_type: passport.type,
          investor_name:
            passport.type === "Entity"
              ? passport.representative
              : passport.name,
          investor_entity_name:
            passport.type === "Entity" ? passport.name : null,
          investor_country: passport.country,
          investor_state: (
            passport.tax_information?.tax_form as W9ETaxForm | W9TaxForm
          ).state,
          accredited_investor_type: passport.accreditation_type,
          carry_fee_percent: deal.carry_fee,
          management_fee_percent: deal.management_fee,
          management_fee_frequency: deal.management_fee_frequency,
        },
        { upsert: true, new: true }
      );

      res.send(investment);

      await initializeInvestment(
        investment,
        req.headers["x-api-token"] as string
      );
    } catch (e) {
      next(e);
    }
  })

  .patch("/:id", async (req, res, next) => {
    try {
      const investment = await Investment.findById(req.params.id);
      if (!investment) {
        throw new HttpError("Not Found", 404);
      }
      if (
        investment.phase !== "signed" &&
        investment.phase !== "agreements-pending"
      ) {
        throw new HttpError("Cannot edit investment", 400);
      }

      res.send(
        await Investment.findByIdAndUpdate(investment._id, req.body, {
          new: true,
        })
      );

      await editInvestment(investment, req.headers["x-api-token"] as string);
    } catch (e) {
      next(e);
    }
  })

  .get("/:id", async (req, res, next) => {
    try {
      const investment = await Investment.findById(req.params.id);
      if (!investment) {
        throw new HttpError("Not Found", 404);
      }
      res.send(investment);
    } catch (e) {
      next(e);
    }
  })

  .get("/:id/agreements", async (req, res, next) => {
    try {
      const agreements = await InvestmentAgreement.find({
        investment_id: req.params.id,
        ...req.query,
      }).select("+s3_bucket +s3_key");

      res.send(
        await Promise.all(
          agreements.map(async (agreement) => {
            if (!agreement.s3_bucket || !agreement.s3_key) return agreement;

            const command = new GetObjectCommand({
              Bucket: agreement.s3_bucket,
              Key: agreement.s3_key,
            });

            return {
              ...agreement.toJSON(),
              link: await getSignedUrl(client, command),
            };
          })
        )
      );
    } catch (e) {
      next(e);
    }
  });
