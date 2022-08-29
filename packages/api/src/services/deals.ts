import { Deal } from "@allocations/core-models";
import fetch from "node-fetch";

const NONBODY_METHODS = ["GET", "DELETE"];

const makeHeaders = (
  method: string,
  token: string
): { [key: string]: string } => {
  return NONBODY_METHODS.includes(method)
    ? { "X-API-TOKEN": token }
    : {
        "X-API-TOKEN": token,
        "Content-Type": "application/json",
      };
};

const request = async ({
  method,
  path,
  token,
  body,
}: {
  method: string;
  path: string;
  token: string;
  body?: any;
}) => {
  const res = await fetch(`${process.env.DEAL_SERVICE_URL}${path}`, {
    method,
    headers: makeHeaders(method, token),
    body: NONBODY_METHODS.includes(method)
      ? undefined
      : JSON.stringify(body || {}),
  });

  if (!res.ok) {
    throw new Error(`Error at ${path}: ${await res.text()}`);
  }

  return res.json();
};

export const signAgreement = (deal: Deal, token: string) => {
  return request({
    token,
    path: `/${deal.phase}/check`,
    method: "POST",
    body: { id: deal._id },
  });
};
