import { Router } from "express";
import { HttpError } from "@allocations/api-common";
import { Entity } from "@allocations/core-models";
import { completeFormation, verifyEntity } from "../../services/entities";

export default Router()
  .post("/", async (req, res, next) => {
    try {
      const entity = await Entity.create({
        ...req.body,
        phase: "verify-entity",
      });
      res.send(entity);
    } catch (e) {
      next(e);
    }
  })

  .post("/:id/verify", async (req, res, next) => {
    try {
      const entity = await Entity.findByIdAndUpdate(req.params.id, req.body);
      if (!entity) {
        throw new HttpError("Not Found", 404);
      }
      await verifyEntity(req.params.id, req.headers["x-api-token"] as string);
      res.send(entity);
    } catch (e) {
      next(e);
    }
  })

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
