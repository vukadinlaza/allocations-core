import { Router } from "express";
import { Entity } from "@allocations/core-models";
import logger from "../../../logger";
import { basename } from "path";
import { HttpError } from "@allocations/api-common";
const fileName = basename(__filename, ".ts");
const log = logger().child({ module: fileName });

export default Router()
  .post("/", async (req, res, next) => {
    try {
      const newEntity = await Entity.create(req.body);
      res.send(newEntity);
    } catch (e: any) {
      next(e);
      log.error({ err: e }, e.message);
    }
  })
  .get("/check/:name", async (req, res, next) => {
    try {
      const entityName = req.params.name;
      const entity = await Entity.findOne({ name: entityName });
      if (entity) {
        res.status(404);
        throw new Error(`Entity with name '${entity.name}' already exists`);
      }
      res.send({ message: "Available name" });
    } catch (e: any) {
      next(e);
      log.error({ err: e }, e.message);
    }
  })
  .get("/", async (req, res, next) => {
    try {
      const entities = await Entity.find(req.query);
      res.send(entities);
    } catch (e: any) {
      next(e);
      log.error({ err: e }, e.message);
    }
  })
  .put("/:entity_id", async (req, res, next) => {
    try {
      const ent = await Entity.findOneAndUpdate(
        { _id: req.params.entity_id },
        req.body,
        { new: true }
      );

      if (!ent)
        throw new HttpError(
          `Entity with id ${req.params.entity_id} Not Found`,
          404
        );

      res.send(req.body);
    } catch (e: any) {
      next(e);
      log.error({ err: e }, e.message);
    }
  });
