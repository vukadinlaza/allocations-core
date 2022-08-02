import type { S3Event } from "aws-lambda";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import { InvestorPassport, PassportAsset } from "@allocations/core-models";
import { hasIdentification } from "./utils";

export const handler = async ({ Records }: S3Event) => {
  await connectMongoose();

  for (const record of Records) {
    const [, passport_id, type] = record.s3.object.key.split("/");
    const passport = await InvestorPassport.findById(passport_id);
    if (!passport) continue;

    await PassportAsset.create({
      passport_id,
      type,
      bucket: record.s3.bucket.name,
      path: record.s3.object.key,
    });

    if (await hasIdentification(passport)) {
      await triggerTransition({
        id: passport._id.toString(),
        action: "DONE",
        phase: "onboarding",
      });
    }
  }
};
