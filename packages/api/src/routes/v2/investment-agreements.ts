import { Router } from "express";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { InvestmentAgreement } from "@allocations/core-models";
import { HttpError } from "@allocations/api-common";
import { checkAgreements } from "../../services/investmentsV2";

const client = new S3Client({ region: "us-east-1" });

export default Router()
  .post("/:id/sign", async (req, res, next) => {
    try {
      const agreement = await InvestmentAgreement.findByIdAndUpdate(
        req.params.id,
        {
          signature_packet: req.body,
        },
        { new: true }
      );
      if (!agreement) {
        throw new HttpError("Not Found", 404);
      }
      res.send(agreement);

      await checkAgreements(
        agreement.investment_id.toString(),
        req.headers["x-api-token"] as string
      );
    } catch (e) {
      next(e);
    }
  })

  .get("/:id", async (req, res, next) => {
    try {
      const agreement = await InvestmentAgreement.findById(
        req.params.id
      ).select("+s3_bucket +s3_key");
      if (!agreement) {
        throw new HttpError("Not Found", 404);
      }

      const command = new GetObjectCommand({
        Bucket: agreement.s3_bucket,
        Key: agreement.s3_key,
      });
      const link = await getSignedUrl(client, command);
      res.send({ ...agreement.toJSON(), link });
    } catch (e) {
      next(e);
    }
  })

  .get("/", async (req, res, next) => {
    try {
      const agreements = await InvestmentAgreement.find(req.query).select(
        "+s3_bucket +s3_key"
      );
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
