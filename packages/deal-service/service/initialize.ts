"use strict";
import {
  parseRequest,
  send,
  sendError,
  connectMongoose,
  triggerTransition,
  LambdaEvent,
  HttpError,
} from "@allocations/service-common";
import { Deal } from "@allocations/core-models";

export const handler = async (event: LambdaEvent) => {
  try {
    const { body = {} } = parseRequest(event);
    await connectMongoose();

    const deal = await Deal.findById(body.id);
    if (!deal) throw new HttpError(`Deal with id ${body.id} Not Found`, "404");

    // transition to build
    await triggerTransition({
      id: deal._id.toString(),
      action: "CREATED",
      phase: deal.phase,
    });

    return send({ acknowledged: true, _id: deal._id });
  } catch (err: any) {
    console.error(err);
    return sendError({ error: err, status: err.status });
  }
};
