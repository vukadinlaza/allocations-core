import { Entity } from "@allocations/core-models";
import { Organization } from "@allocations/core-models";
import {
  connectMongoose,
  sendError,
  triggerTransition,
} from "@allocations/service-common";

type EntityWithOrganizations = (Entity & {
  organizations: Organization[];
})[];

export const handler = async () => {
  await connectMongoose();
  try {
    const entities: EntityWithOrganizations | null = await Entity.find({
      phase: "organization-pending",
    }).populate("organizations");

    for (const entity of entities) {
      const readyToTransition = entity.organizations.some(
        (org) => org.phase === "complete" || org.phase === "entity-pending"
      );

      if (readyToTransition) {
        triggerTransition({
          id: entity._id.toString(),
          action: "DONE",
          phase: "organization-pending",
        });
      }
    }
  } catch (e: any) {
    console.error(e);
    return sendError(e);
  }
};
