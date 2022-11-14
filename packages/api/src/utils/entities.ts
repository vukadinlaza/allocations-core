import { Entity } from "@allocations/core-models";

// returns a non Allocations v1 entity if it can find one, otherwise return null or Allocations Funds entitiy
export const findNonAllocationsV1Entity = async (org_id: string) => {
  // get all entities
  const entities = await Entity.find({
    organization_ids: org_id,
  });

  // if there arent any, return null
  if (!entities.length) return null;

  // if there are more than one and one of them is Allocations Funds LLC, return the first one that isnt Allocations Funds LLC

  if (
    entities.length > 1 &&
    entities.find((ent) => ent._id.toString() === process.env.ATOMIZER_ID)
  )
    return entities.find(
      (ent) => ent._id.toString() !== process.env.ATOMIZER_ID
    );

  // return the first entity
  return entities[0];
};
