import { PlaidTransaction } from "@allocations/core-models";
import {
  LambdaEvent,
  parseRequest,
  connectMongoose,
  sendError,
  HttpError,
  send,
  sendMessage,
} from "@allocations/service-common";

export const handler = async (event: LambdaEvent) => {
  try {
    const { body = {} } = parseRequest(event);
    await connectMongoose();

    const transaction = await PlaidTransaction.findById(body.id);
    if (!transaction) {
      throw new HttpError(
        `PlaidTransaction with id ${body.id} not found`,
        "404"
      );
    }

    if (!transaction.investment_id) {
      throw new HttpError(
        `PlaidTransaction with id ${body.id} missing investment_id`,
        "400"
      );
    }

    await sendMessage({
      id: transaction.investment_id.toString(),
      app: "core",
      service: "investment-v2",
      event: "reconcile",
      payload: {
        investment_id: transaction.investment_id,
        type: "wire",
      },
    });

    return send({ acknowledged: true, _id: transaction._id });
  } catch (err: any) {
    return sendError({ error: err, status: err.status });
  }
};
