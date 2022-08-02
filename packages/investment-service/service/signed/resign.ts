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
      phase: "signed",
    });

    if (!investment) {
      return sendError({
        error: new Error(`Unable to resign investment with id ${body.id}`),
        status: "400",
      });
    }

    await triggerTransition({
      id: investment._id.toString(),
      action: "RESIGN",
      phase: "signed",
    });

    return send({ acknowledged: true });
  } catch (err: any) {
    console.error(err);
    return sendError({ error: err as Error, status: "500" });
  }
};
