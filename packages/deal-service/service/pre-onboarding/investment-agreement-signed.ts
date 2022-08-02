import {
  connectMongoose,
  triggerCheck,
  LambdaEvent,
  parseRequest,
  HttpError,
  send,
  sendError,
} from "@allocations/service-common";
import { DealPhase } from "@allocations/core-models";

export const handler = async (event: LambdaEvent) => {
  try {
    await connectMongoose();
    const { body } = parseRequest(event);

    const phase = await DealPhase.findOneAndUpdate(
      {
        deal_id: body.id,
        name: "pre-onboarding",
        "tasks.title": "Sign Investment Agreement",
      },
      {
        "tasks.$.complete": true,
        metadata: { investment_agreement_id: body.id },
      },
      { new: true }
    );

    if (!phase)
      throw new HttpError(
        `Unable to find phase for deal with id ${body.id}`,
        "404"
      );

    await triggerCheck({
      id: phase.deal_id.toString(),
      check_id: phase._id.toString(),
      phase: phase.name,
    });

    return send({ acknowledged: true });
  } catch (err: any) {
    console.error(err);
    return sendError({ error: err, status: err.status });
  }
};
