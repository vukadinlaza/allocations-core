import { Organization, OrganizationAgreement } from "@allocations/core-models";
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
    if (!organization) {
      throw new HttpError(`Organization with id ${body.id} not found`, "404");
    }

    const agreements = await OrganizationAgreement.find({
      organization_id: organization._id,
      signed: false,
    });
    if (!agreements.length) {
      await triggerTransition({
        id: organization._id.toString(),
        action: "DONE",
        phase: "agreements-pending",
      });
    }

    return send({ acknowledged: true, _id: organization._id });
  } catch (err: any) {
    return sendError({ error: err, status: err.status });
  }
};
