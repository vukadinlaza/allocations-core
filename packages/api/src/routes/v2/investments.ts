import { Router } from "express";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  Deal,
  Document,
  Investment,
  InvestmentAgreement,
  InvestorPassport,
  PlaidAccount,
  StripeAccount,
  TaxInformation,
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
      const { passport_id, deal_id, user_id, ...rest } = req.body;
      const [deal, existingInvestment] = await Promise.all([
        Deal.findById(deal_id),
        Investment.findOne({
          phase: "invited",
          deal_id,
          user_id
        }),
      ]);

      if (!deal) {
        throw new HttpError("Invalid Deal", 400);
      }

      if (!passport_id) {
        if (existingInvestment) {
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
        } else {
          const investment = await Investment.create({
            ...rest,
            phase: "invited",
            deal_id,
            user_id
          });
          res.send(investment);
        }

        return;
      }

      const passport = await InvestorPassport.findById(passport_id).populate<{
        tax_information: TaxInformation;
      }>("tax_information");
      if (!passport) {
        throw new HttpError("Invalid InvestorPassport", 400);
      }

      let investment;
      if (existingInvestment) {
        if (passport.test && !existingInvestment.test) {
          throw new HttpError(
            "Mismatch test environment: InvestorPassport is in test mode",
            400
          );
        }

        investment = await Investment.findOneAndUpdate(
          { phase: "invited", deal_id, user_id },
          {
            ...rest,
            test: existingInvestment.test,
            passport_id,
            phase: "invited",
            carry_fee_percent: deal.carry_fee,
            management_fee_percent: deal.management_fee,
            management_fee_frequency: deal.management_fee_frequency,
            metadata: {
              submission_data: {
                passport_id,
                ...rest
              }
            }
          },
          { upsert: true, new: true }
        );
      } else {
        if (passport.test && !rest.test) {
          throw new HttpError(
            "Mismatch test environment: InvestorPassport is in test mode",
            400
          );
        }

        investment = await Investment.create({
          ...rest,
          test: rest.test,
          passport_id,
          deal_id,
          user_id,
          phase: "invited",
          carry_fee_percent: deal.carry_fee,
          management_fee_percent: deal.management_fee,
          management_fee_frequency: deal.management_fee_frequency,
          metadata: {
            submission_data: {
              passport_id,
              ...rest
            }
          }
        });
      }
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
  })

  .get("/:id/payment-methods", async (req, res, next) => {
    try {
      const paymentMethods = [];
      const investment = await Investment.findById(req.params.id).populate<{
        deal: Deal;
      }>("deal");
      if (!investment) {
        throw new HttpError("Investment Not Found", 404);
      }

      const wireInstructions = await Document.findOne({
        deal_id: investment.deal._id,
        title: "Wire Instructions",
      });
      if (wireInstructions) {
        const account = await PlaidAccount.findOne({
          deal_id: investment.deal._id,
        });

        paymentMethods.push({
          type: "wire-instructions",
          title: "Wire",
          link: await wireInstructions.getLink(),
          account_name: account?.account_name,
          account_number: account?.account_number,
          routing_number: account?.routing_number,
        });
      }

      const stripeAccount = await StripeAccount.findOne({
        phase: "live",
        deal_id: investment.deal_id,
      });
      if (stripeAccount) {
        paymentMethods.push({
          type: "ach",
          title: "ACH",
        });
      }

      res.send(paymentMethods);
    } catch (e) {
      next(e);
    }
  });
