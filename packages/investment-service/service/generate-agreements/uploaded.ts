import type { S3Event } from "aws-lambda";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import { Investment, InvestmentAgreement } from "@allocations/core-models";

export const handler = async ({ Records }: S3Event) => {
  await connectMongoose();

  for (const record of Records) {
    try {
      const [, investmentId, type] = record.s3.object.key.split("/");

      const [investment] = await Promise.all([
        Investment.findById(investmentId),
        InvestmentAgreement.create({
          title: `${type}.pdf`,
          type,
          investment_id: investmentId,
          signed: false,
          md5: record.s3.object.eTag,
          s3_bucket: record.s3.bucket.name,
          s3_key: record.s3.object.key,
        }),
      ]);

      if (!investment) continue;

      await triggerTransition({
        id: investmentId,
        action: "GENERATION_COMPLETE",
        phase: "generate-agreements",
      });
    } catch (err) {
      console.error(err);
    }
  }
};
