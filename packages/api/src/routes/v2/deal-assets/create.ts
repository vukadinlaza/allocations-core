import { ObjectId } from "mongodb";
import { DealAsset } from "@allocations/core-models";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { RequestHandler } from "express";

const client = new S3Client({ region: "us-east-1" });

export const create: RequestHandler = async (req, res, next) => {
  try {
    const _id = new ObjectId();
    const key = `uploads/deals/${req.body.deal_id}/${_id}${
      req.body.content_type === "application/pdf" ? ".pdf" : ""
    }`;
    await DealAsset.create({
      ...req.body,
      _id,
      s3_bucket: process.env.DOCUMENTS_BUCKET,
      s3_key: key,
    });

    const command = new PutObjectCommand({
      Bucket: process.env.DOCUMENTS_BUCKET,
      Key: key,
      ContentType: req.body.content_type,
    });
    const link = await getSignedUrl(client, command);

    res.send({ link });
  } catch (e) {
    next(e);
  }
};
