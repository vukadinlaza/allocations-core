import { PlaidAccount } from "@allocations/core-models";
import {
  LambdaEvent,
  parseRequest,
  connectMongoose,
  sendError,
  HttpError,
  triggerTransition,
  send,
} from "@allocations/service-common";

export const handler = async (event: LambdaEvent) => {
  try {
    const { body = {} } = parseRequest(event);
    await connectMongoose();

    const account = await PlaidAccount.findById(body.id);
    if (!account)
      throw new HttpError(`PlaidAccount with id ${body.id} not found`, "404");

    await triggerTransition({
      id: account._id.toString(),
      action: "CREATED",
      phase: "new",
    });

    return send({ acknowledged: true, _id: account._id });
  } catch (err: any) {
    return sendError({ error: err, status: err.status });
  }
};
