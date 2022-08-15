import { Router } from "express";
import { HttpError } from "@allocations/api-common";
import { EntityAgreement } from "@allocations/core-models";
import { signAgreement } from "../../services/entities";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({ region: "us-east-1" });

export default Router()
  .get("/", async (req, res, next) => {
    try {
      const agreements = await EntityAgreement.find(req.query).select(
        "+s3_bucket +s3_key"
      );
      const agreementsWithLink = await Promise.all(
        agreements.map(async (agreement) => {
          const agreementJSON = agreement.toJSON();
          const command = new GetObjectCommand({
            Bucket: agreement.s3_bucket,
            Key: agreement.s3_key,
          });

          delete agreementJSON.s3_bucket;
          delete agreementJSON.s3_key;

          return {
            ...agreementJSON,
            link: await getSignedUrl(client, command),
          };
        })
      );

      res.send(agreementsWithLink);
    } catch (e: any) {
      next(e);
    }
  })

  .post("/:id/sign", async (req, res, next) => {
    try {
      const agreement = await EntityAgreement.findByIdAndUpdate(
        req.params.id,
        {
          signed: true,
          signature_packet: req.body,
        },
        { new: true }
      );
      if (!agreement) {
        throw new HttpError("Agreement Not Found", 404);
      }

      res.send(agreement);

      await signAgreement(
        agreement.entity_id.toString(),
        req.headers["x-api-token"] as string
      );
    } catch (e) {
      next(e);
    }
  });
