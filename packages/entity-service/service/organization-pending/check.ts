import {
  connectMongoose,
  sendError,
  triggerTransition,
} from "@allocations/service-common";
import { SNSEvent } from "aws-lambda";
import { Entity } from "@allocations/core-models";
import { Organization } from "@allocations/core-models";

type EntityWithOrganizations = Entity & {
  organizations: Organization[];
};

export const handler = async ({ Records }: SNSEvent) => {
  await connectMongoose();

  try {
    for (const record of Records) {
      const { _id } = JSON.parse(record.Sns.Message);

      const entityWithOrganizations: EntityWithOrganizations | null =
        await Entity.findById(_id).populate("organizations");

      if (!entityWithOrganizations)
        throw new Error(
          `Unable to find organizations associate with Entity with id ${_id}`
        );

      const readyToTransition = entityWithOrganizations.organizations.some(
        (org) => org.phase === "complete" || org.phase === "entity-pending"
      );

      if (readyToTransition) {
        await triggerTransition({
          id: entityWithOrganizations._id.toString(),
          action: "DONE",
          phase: "organization-pending",
        });
      }
    }
  } catch (err: any) {
    console.error(err);
    return sendError({ error: err, status: err.status });
  }
};
