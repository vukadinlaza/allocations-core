import type { S3Event } from "aws-lambda";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import { Organization, OrganizationAgreement } from "@allocations/core-models";

export const handler = async ({ Records }: S3Event) => {
  await connectMongoose();

  for (const record of Records) {
    try {
      const [organizationId, type, title] = record.s3.object.key.split("/");
      const [organization] = await Promise.all([
        Organization.findById(organizationId),
        OrganizationAgreement.create({
          title,
          type,
          organization_id: organizationId,
          signed: false,
          md5: record.s3.object.eTag,
          s3_bucket: record.s3.bucket.name,
          s3_key: record.s3.object.key,
        }),
      ]);

      const [servicesAgreement, mou] = await Promise.all([
        OrganizationAgreement.findOne({
          organization_id: organizationId,
          type: "services-agreement",
        }),
        OrganizationAgreement.findOne({
          organization_id: organizationId,
          type: "memorandum-of-understanding",
        }),
      ]);

      let waitingForGeneration = false;
      if (!servicesAgreement) {
        waitingForGeneration = true;
      }

      if (organization!.high_volume_partner && !mou) {
        waitingForGeneration = true;
      }

      if (waitingForGeneration) continue;

      await triggerTransition({
        id: organizationId,
        action: "GENERATION_COMPLETE",
        phase: "generate-agreements",
      });
    } catch (err) {
      console.error(err);
    }
  }
};
