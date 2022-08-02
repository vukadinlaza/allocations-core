import { DealPhase, Document } from "@allocations/core-models";
import { S3 } from "aws-sdk";

export const deleteDocumentByTaskId = async (
  task_id: string
): Promise<{ deleted: true }> => {
  const s3 = new S3();
  const deletedDoc = await Document.findOneAndDelete({ task_id });
  if (!deletedDoc) throw new Error(`No document with task id ${task_id} found`);

  const phase = await DealPhase.findOneAndUpdate(
    { "tasks._id": task_id },
    {
      "tasks.$.complete": false,
    },
    { new: true }
  );
  if (!phase) throw new Error(`No phase with task id ${task_id} found`);

  await s3
    .deleteObject({
      Bucket: deletedDoc?.bucket,
      Key: deletedDoc.path,
    })
    .promise();

  return { deleted: true };
};
