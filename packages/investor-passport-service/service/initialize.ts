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

    const investorPassport = await InvestorPassport.findById(body.id);
    if (!investorPassport)
      throw new HttpError(
        `InvestorPassport with id ${body.id} Not Found`,
        "404"
      );

    // transition to onboarding
    await triggerTransition({
      id: investorPassport._id.toString(),
      action: "CREATED",
      phase: "new",
    });

    return send({ acknowledged: true, _id: investorPassport._id });
  } catch (err: any) {
    console.error(err);
    return sendError({ error: err, status: err.status });
  }
};
