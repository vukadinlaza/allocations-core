"use strict";
import {
  send,
  sendError,
  connectMongoose,
  LambdaEvent,
  parseRequest,
  HttpError,
  triggerCheck,
} from "@allocations/service-common";
import { DealPhase } from "@allocations/core-models";

export const handler = async (event: LambdaEvent) => {
  try {
    await connectMongoose();

    const { body } = await parseRequest(event);

    const phase = await DealPhase.findOneAndUpdate(
      {
        deal_id: body.id,
        "tasks.title": "User Acknowledged Complete",
      },
      {
        "tasks.$.complete": true,
      }
    );

    if (!phase) {
      throw new HttpError(
        `Unable to find phase for deal with id ${body.id}`,
        "404"
      );
    }
    await triggerCheck({
      id: phase.deal_id.toString(),
      check_id: phase._id.toString(),
      phase: "post-closing",
    });

    return send({ acknowledged: true });
  } catch (err: any) {
    console.error(err);
    return sendError({ error: err, status: err.status });
  }
};
