import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import { SNSEvent } from "aws-lambda";
import { DealPhase } from "@allocations/core-models";

export const handler = async ({ Records }: SNSEvent): Promise<void> => {
  await connectMongoose();

  for (const record of Records) {
    const { check_id } = JSON.parse(record.Sns.Message);
    const phase = await DealPhase.findById(check_id);
    if (!phase) throw new Error(`Unable to find phase with id ${check_id}`);

    if (phase.tasks.every(({ complete, required }) => complete || !required)) {
      await triggerTransition({
        id: phase.deal_id.toString(),
        action: "DONE",
        phase: "post-closing",
      });
    }
  }
};
