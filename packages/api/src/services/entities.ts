import { Entity } from "@allocations/core-models";
import { requestFactory } from "./request";

const request = requestFactory(process.env.ENTITY_SERVICE_URL!);

export const initializeEntity = (entity: Entity, token: string) => {
  return request({
    token,
    path: "/initialize",
    method: "POST",
    body: { id: entity._id },
  });
};
