import { HttpError } from "@allocations/api-common";
import fetch from "node-fetch";

const NONBODY_METHODS = ["GET", "DELETE"];

export const requestFactory = (url: string) => {
  return async ({
    path,
    method,
    token,
    body,
  }: {
    path: string;
    method: string;
    token: string;
    body?: any;
  }) => {
    const headers: { [key: string]: string } = {
      "X-API-TOKEN": token,
    };
    if (!NONBODY_METHODS.includes(method)) {
      headers["Content-Type"] = "application/json";
    }

    const res = await fetch(`${url}${path}`, {
      method,
      headers,
      body: NONBODY_METHODS.includes(method) ? undefined : JSON.stringify(body),
    });

    if (!res.ok) {
      let json;
      try {
        json = await res.json();
      } catch (e) {
        json = { message: `Request to ${path} failed` };
      }
      throw new HttpError(json.message || json.error, res.status);
    }

    return res.json();
  };
};
