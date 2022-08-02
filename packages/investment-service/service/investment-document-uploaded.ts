import { connectMongoose } from "@allocations/service-common";
import { S3Event } from "aws-lambda";
import { Document } from "@allocations/core-models";

export const handler = async ({ Records }: S3Event) => {
  await connectMongoose();
  for (const record of Records) {
    console.log({ record });
    console.log(JSON.stringify(record, null, 2));
    const document = await Document.findOneAndUpdate(
      {
        investment_id: record.s3.object.key.split("/")[1],
      },
      {
        complete: true,
        bucket: record.s3.bucket.name,
        path: record.s3.object.key,
        content_type: record.s3.object.key.split(".")[1],
      }
    );

    if (!document) {
      throw new Error(`Unable to find document: ${record.s3.object.key}`);
    }
  }
};
