import { MigrationUpload } from "@allocations/core-models";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Request, RequestHandler } from "express";
import { ObjectId } from "mongodb";

const client = new S3Client({ region: "us-east-1" });

type CreateUploadBody = {
  readonly migration_id: string;
  readonly notes: string;
  readonly title?: string;
};

export const createUpload: RequestHandler = async (
  req: Request<{}, {}, CreateUploadBody, {}, {}>,
  res,
  next
) => {
  try {
    const _id = new ObjectId();
    const key = `migrations/${req.body.migration_id}/${_id}`;
    const upload = await MigrationUpload.create({
      ...req.body,
      _id,
      s3_bucket: process.env.DOCUMENTS_BUCKET,
      s3_key: key,
    });

    const command = new PutObjectCommand({
      Bucket: process.env.DOCUMENTS_BUCKET,
      Key: key,
    });

    const link = await getSignedUrl(client, command);
    const uploadObject = upload.toObject();

    res.send({ ...uploadObject, link });
  } catch (e) {
    next(e);
  }
};
