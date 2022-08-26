import { Router } from "express";
import { HttpError } from "@allocations/api-common";
import { Entity } from "@allocations/core-models";
import { completeFormation } from "../../services/entities";

export default Router()
  .get("/", async (req, res, next) => {
    try {
      const entities = await Entity.find(req.query);
      res.send(entities);
    } catch (e: any) {
      next(e);
    }
  })

  .get("/:id", async (req, res, next) => {
    try {
      const entity = await Entity.findById(req.params.id);
      if (!entity) throw new HttpError("Unable to find Entity", 404);

      res.send(entity);
    } catch (e: any) {
      next(e);
    }
  })

  .post("/:id/complete", async (req, res, next) => {
    try {
      const entity = await Entity.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      await completeFormation(
        req.params.id,
        req.headers["x-api-token"] as string
      );
      res.send(entity);
    } catch (e: any) {
      next(e);
    }
  });
