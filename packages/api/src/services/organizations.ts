import { ObjectId } from "mongoose";
import { Organization } from "@allocations/core-models";
import { requestFactory } from "./request";

const request = requestFactory(process.env.ORGANIZATION_SERVICE_URL!);

export const initializeOrganization = (
  organization: Organization,
  token: string
) => {
  return request({
    token,
    path: "/initialize",
    method: "POST",
    body: { id: organization._id },
  });
};

export const signAgreement = (
  organizationId: ObjectId | string,
  token: string
) => {
  return request({
    token,
    path: "/agreements-pending/check",
    method: "POST",
    body: { id: organizationId },
  });
};

export const approveOpsHandoff = (
  organizationId: ObjectId | string,
  token: string
) => {
  return request({
    token,
    path: "/ops-handoff/approve",
    method: "POST",
    body: { id: organizationId },
  });
};
