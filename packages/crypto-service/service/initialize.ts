import { CryptoTransaction } from "@allocations/core-models";
import {
  connectMongoose,
  parseRequest,
  send,
  sendError,
  LambdaEvent,
  triggerTransition,
  LambdaResponse,
  HttpError,
} from "@allocations/service-common";

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  try {
    await connectMongoose();
    const { body } = parseRequest(event);
    const cryptoTransaction = await CryptoTransaction.findOne({
      _id: body.id,
      phase: "new",
    });

    if (!cryptoTransaction) {
      throw new HttpError("Not Found", "404");
    }

    await triggerTransition({
      id: cryptoTransaction._id.toString(),
      action: "CREATED",
      phase: "new",
    });

    return send({ acknowledged: true });
  } catch (err: any) {
    console.error(err);
    return sendError({ error: err as Error, status: err.status || "500" });
  }
};
