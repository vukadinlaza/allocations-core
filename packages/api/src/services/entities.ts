import { requestFactory } from "./request";

const request = requestFactory(process.env.ENTITY_SERVICE_URL!);

export const completeFormation = (entityId: string, token: string) => {
  return request({
    token,
    path: "/complete",
    method: "POST",
    body: { id: entityId },
  });
};

export const signAgreement = (entityId: string, token: string) => {
  return request({
    token,
    path: "/agreements-pending/check",
    method: "POST",
    body: { id: entityId },
  });
};
