import type { S3Event } from "aws-lambda";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import { Entity, EntityAgreement } from "@allocations/core-models";

export const handler = async ({ Records }: S3Event) => {
  await connectMongoose();

  for (const record of Records) {
    try {
      const [, entityId, type, title] = record.s3.object.key.split("/");
      await Promise.all([
        Entity.findById(entityId),
        EntityAgreement.create({
          title,
          type,
          entity_id: entityId,
          signed: false,
          md5: record.s3.object.eTag,
          s3_bucket: record.s3.bucket.name,
          s3_key: record.s3.object.key,
        }),
      ]);

      await triggerTransition({
        id: entityId,
        action: "GENERATION_COMPLETE",
        phase: "generate-agreements",
      });
    } catch (err) {
      console.error(err);
    }
  }
};
