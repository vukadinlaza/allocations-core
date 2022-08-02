import { Organization } from "@allocations/core-models";
import {
  connectMongoose,
  LambdaEvent,
  parseRequest,
  HttpError,
  send,
  sendError,
  triggerTransition,
} from "@allocations/service-common";

export const handler = async (event: LambdaEvent) => {
  try {
    await connectMongoose();
    const { body } = parseRequest(event);

    const organization = await Organization.findById(body.id);

    if (!organization)
      throw new HttpError(
        `Unable to find organization with id ${body.id}`,
        "404"
      );

    await triggerTransition({
      id: organization._id.toString(),
      action: "DONE",
      phase: "ops-handoff",
    });

    return send({ acknowledged: true });
  } catch (err: any) {
    console.error(err);
    return sendError({ error: err, status: err.status });
  }
};
