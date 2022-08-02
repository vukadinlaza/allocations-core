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
import { hasIdentification } from "./utils";

export const handler = async (event: LambdaEvent) => {
  try {
    const { body = {} } = parseRequest(event);
    await connectMongoose();

    const passport = await InvestorPassport.findById(body.id);
    if (!passport)
      throw new HttpError(
        `InvestorPassport with id ${body.id} Not Found`,
        "404"
      );

    if (passport.phase === "onboarding") {
      // check if all information is filled
      if (await hasIdentification(passport)) {
        await triggerTransition({
          id: passport._id.toString(),
          action: "DONE",
          phase: "onboarding",
        });

        return send({
          success: true,
          message: `Updated passport ${passport._id.toString()} and transitioned to kyc`,
        });
      } else {
        return send({
          success: false,
          message: `passport ${passport._id.toString()} did not contain one or more pieces of Identification information required to transition to kyc`,
        });
      }
    }
    return send({ acknowledged: true, id: passport._id.toString() });
  } catch (err: any) {
    console.error(err);
    return sendError({ error: err, status: err.status });
  }
};
