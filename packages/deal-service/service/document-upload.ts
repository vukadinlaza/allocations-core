import type { S3Event } from "aws-lambda";
import { connectMongoose, triggerCheck } from "@allocations/service-common";
import { DealPhase, Document } from "@allocations/core-models";
import { Organization } from "@allocations/core-models";
import logger from "../logger";
import { basename } from "path";
const fileName = basename(__filename, ".ts");
const log = logger().child({ module: fileName });

export const handler = async ({ Records }: S3Event) => {
  try {
    await connectMongoose();

    for (const record of Records) {
      const document = await Document.findOneAndUpdate(
        { path: record.s3.object.key },
        { complete: true },
        { new: true }
      );
      if (!document) continue;

      if (document.title.includes("Memorandum Of Understanding")) {
        await Organization.findByIdAndUpdate(document.organization_id, {
          mou_signed: true,
        });
      }

      const phase = await DealPhase.findOneAndUpdate(
        { "tasks._id": document.task_id },
        {
          "tasks.$.complete": true,
          "tasks.$.done_by": document.uploader_email,
          "tasks.$.metadata.document_id": document._id,
        }
      );
      if (!phase) continue;

      await triggerCheck({
        id: phase.deal_id.toString(),
        check_id: phase._id.toString(),
        phase: phase.name,
      });
    }
  } catch (err: any) {
    log.error({ err: err }, err.message);
  }
};
