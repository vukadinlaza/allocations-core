import { DealAgreement } from "@allocations/core-models";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { RequestHandler } from "express";

const client = new S3Client({ region: "us-east-1" });

export const getAgreementByQuery: RequestHandler = async (req, res, next) => {
  try {
    const agreements = await DealAgreement.find(req.query)
      .select("+s3_bucket +s3_key")
      .lean();

    const agreementsWithLink = await Promise.all(
      agreements.map(async (agreement) => {
        const command = new GetObjectCommand({
          Bucket: agreement.s3_bucket,
          Key: agreement.s3_key,
        });

        delete agreement.s3_bucket;
        delete agreement.s3_key;

        return {
          ...agreement,
          link: await getSignedUrl(client, command),
        };
      })
    );

    res.send(agreementsWithLink);
  } catch (e) {
    next(e);
  }
};
