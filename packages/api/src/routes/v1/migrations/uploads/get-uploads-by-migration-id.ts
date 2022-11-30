import { MigrationUpload } from "@allocations/core-models";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { RequestHandler } from "express";

const client = new S3Client({ region: "us-east-1" });

export const getUploadsByMigrationId: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const uploads = await MigrationUpload.find({
      migration_id: req.params.id,
    }).lean();

    const uploadsWithLinks = await Promise.all(
      uploads.map(async (upload) => {
        const command = new GetObjectCommand({
          Bucket: upload.s3_bucket,
          Key: upload.s3_key,
        });

        return { ...upload, link: await getSignedUrl(client, command) };
      })
    );
    res.send(uploadsWithLinks);
  } catch (e) {
    next();
  }
};
