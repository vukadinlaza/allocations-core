import { Organization } from "@allocations/core-models";
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

    const organization = await Organization.findById(body.id);
    if (!organization)
      throw new HttpError(`Organization with id ${body.id} not found`, "404");

    await triggerTransition({
      id: organization._id.toString(),
      action: "CREATED",
      phase: "new",
    });

    return send({ acknowledged: true, _id: organization._id });
  } catch (err: any) {
    return sendError({ error: err, status: err.status });
  }
};
