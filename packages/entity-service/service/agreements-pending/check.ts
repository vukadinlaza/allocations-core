import { Entity, EntityAgreement } from "@allocations/core-models";
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

    const entity = await Entity.findById(body.id);
    if (!entity) {
      throw new HttpError(`Entity with id ${body.id} not found`, "404");
    }

    const agreements = await EntityAgreement.find({
      organization_id: entity._id,
      signed: false,
    });
    if (!agreements.length) {
      await triggerTransition({
        id: entity._id.toString(),
        action: "DONE",
        phase: "agreements-pending",
      });
    }

    return send({ acknowledged: true, _id: entity._id });
  } catch (err: any) {
    return sendError({ error: err, status: err.status });
  }
};
