import { RequestHandler } from "express";
import { DealAsset } from "@allocations/core-models";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const client = new S3Client({ region: "us-east-1" });

export const getDealAssetsByQuery: RequestHandler = async (req, res, next) => {
  try {
    const assets = await DealAsset.find(req.query).select("+s3_bucket +s3_key").lean();

    const assetWithLink = await Promise.all(
      assets.map(async (asset) => {
        const command = new GetObjectCommand({
          Bucket: asset.s3_bucket,
          Key: asset.s3_key,
        });

        delete asset.s3_bucket;
        delete asset.s3_key;

        return {
          ...asset,
          link: await getSignedUrl(client, command),
        };
      })
    );

    res.send(assetWithLink);
  } catch (e) {
    next(e);
  }
};
