import { PlaidAccount } from "@allocations/core-models";
import {
  LambdaEvent,
  connectMongoose,
  sendError,
  HttpError,
  triggerTransition,
  send,
} from "@allocations/service-common";

export const handler = async (event: LambdaEvent) => {
  try {
    await connectMongoose();

    const body = JSON.parse(event.body || "{}");
    if (body.webhook_code !== "SYNC_UPDATES_AVAILABLE") {
      return send({ acknowledged: true });
    }

    const account = await PlaidAccount.findOne({
      deal_id: event.pathParameters!.id,
    });
    if (!account)
      throw new HttpError(
        `PlaidAccount with deal_id ${event.pathParameters!.id} not found`,
        "404"
      );

    await triggerTransition({
      id: account._id.toString(),
      action: "RESYNC",
      phase: account.phase,
    });

    return send({ acknowledged: true });
  } catch (err: any) {
    return sendError({ error: err, status: err.status });
  }
};
