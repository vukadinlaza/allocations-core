import { DealAsset } from "@allocations/core-models";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { RequestHandler } from "express";

const client = new S3Client({ region: "us-east-1" });

export const create: RequestHandler = async (req, res, next) => {
  try {
    await DealAsset.create({
      ...req.body,
      s3_body: "",
      s3_key: "",
    });

    const command = new PutObjectCommand({
      Bucket: "",
      Key: "",
    });
    const link = await getSignedUrl(client, command);

    res.send({ link });
  } catch (e) {
    next(e);
  }
};
