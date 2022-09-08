import { HttpError } from "@allocations/api-common";
import { DealAsset } from "@allocations/core-models";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { RequestHandler } from "express";

const client = new S3Client({ region: "us-east-1" });

export const uploadById: RequestHandler = async (req, res, next) => {
  try {
    const asset = await DealAsset.findById(req.params.id).select(
      "+s3_bucket +s3_key"
    );
    if (!asset) {
      throw new HttpError("Asset Not Found", 404);
    }

    const command = new PutObjectCommand({
      Bucket: asset.s3_bucket,
      Key: asset.s3_key,
    });
    const link = await getSignedUrl(client, command);

    res.send({ link });
  } catch (e) {
    next(e);
  }
};
