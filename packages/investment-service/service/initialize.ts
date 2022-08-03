import { Investment } from "@allocations/core-models";
import {
  connectMongoose,
  parseRequest,
  send,
  sendError,
  LambdaEvent,
  triggerTransition,
  LambdaResponse,
} from "@allocations/service-common";

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  try {
    await connectMongoose();
    const { body } = parseRequest(event);
    const investment = await Investment.findOne({
      _id: body.id,
      phase: "new",
    });

    if (!investment) {
      return send({ acknowledged: true });
    }

    await triggerTransition({
      id: investment._id.toString(),
      action: "CREATED",
      phase: "invited",
    });

    return send({ acknowledged: true });
  } catch (err: any) {
    console.error(err);
    return sendError({ error: err as Error, status: "500" });
  }
};
