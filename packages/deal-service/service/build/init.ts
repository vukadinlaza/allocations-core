import { Deal, DealPhase } from "@allocations/core-models";
import {
  connectMongoose,
  LambdaResponse,
  send,
  sendError,
  triggerCheck,
} from "@allocations/service-common";
import { SQSEvent } from "aws-lambda";

export const handler = async ({
  Records,
}: SQSEvent): Promise<LambdaResponse> => {
  try {
    await connectMongoose();

    for (const record of Records) {
      const { Message } = JSON.parse(record.body);

      const deal = JSON.parse(Message) as Deal;
      const phase = await DealPhase.findOne({
        deal_id: deal._id,
        phase: "build",
      });
      if (!phase) continue;

      await triggerCheck({
        id: deal._id,
        check_id: phase._id.toString(),
        phase: "build",
      });
    }

    return send({
      acknowledged: true,
    });
  } catch (err: any) {
    console.error(err);
    return sendError({ error: err as Error, status: "500" });
  }
};
