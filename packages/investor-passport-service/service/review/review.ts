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
import { InvestorPassport } from "@allocations/core-models";

export const handler = async (event: LambdaEvent) => {
  try {
    const { body = {} } = parseRequest(event);
    await connectMongoose();

    const passport = await InvestorPassport.findById(body.id);
    if (!passport) {
      throw new HttpError(
        `InvestorPassport with id ${body.id} Not Found`,
        "404"
      );
    }

    await triggerTransition({
      id: passport._id.toString(),
      action: body.action,
      phase: "review",
    });

    return send({ acknowledged: true, id: passport._id.toString() });
  } catch (err: any) {
    console.error(err);
    return sendError({ error: err, status: err.status });
  }
};
