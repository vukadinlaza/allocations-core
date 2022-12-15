import { errorMiddleware } from "@allocations/api-common";
import { RequestHandler } from "express";

export const healthCheckRoute: RequestHandler = (req, res, next) => {
  try {
    res.send({ message: "Healthy" });
  } catch (e) {
    errorMiddleware()(e, req, res, next);
  }
};
