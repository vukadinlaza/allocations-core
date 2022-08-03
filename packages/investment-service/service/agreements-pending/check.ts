import {
  LambdaEvent,
  parseRequest,
  connectMongoose,
  sendError,
  triggerTransition,
  send,
} from "@allocations/service-common";
import { InvestmentAgreement } from "@allocations/core-models";

export const handler = async (event: LambdaEvent) => {
  try {
    const { body = {} } = parseRequest(event);
    await connectMongoose();

    const agreements = await InvestmentAgreement.find({
      investment_id: body.id,
      signed: false,
    });
    if (!agreements.length) {
      await triggerTransition({
        id: body.id,
        action: "SIGNED",
        phase: "agreements-pending",
      });
    }

    return send({ acknowledged: true, _id: body.id });
  } catch (err: any) {
    return sendError({ error: err, status: err.status });
  }
};
