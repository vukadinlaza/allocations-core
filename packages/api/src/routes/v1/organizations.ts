import { Router } from "express";
import { Organization, OrganizationAdmin } from "@allocations/core-models";
import { Entity } from "@allocations/core-models";
import mongoose from "mongoose";
import { createMemorandumOfUnderstanding } from "../../utils/memorandumOfUnderstanding";
import { Deal } from "@allocations/core-models";
import { HttpError } from "@allocations/api-common";
import logger from "../../../logger";
import { basename } from "path";
const fileName = basename(__filename, ".ts");
const log = logger.child({ module: fileName });

export default Router()
  .post("/", async (req, res, next) => {
    const { organization, user, deal, entity: entityData } = req.body;
    try {
      if (!user) throw new HttpError("No user found", 404);

      const isSuperAdmin = await OrganizationAdmin.findOne({
        user_id: user._id,
        super_admin: true,
      });

      const newOrg = await Organization.create({
        ...organization,
        phase: "new",
      });

      if (newOrg.high_volume_partner) {
        let entity: Entity;
        try {
          entity = await Entity.create({
            ...entityData,
            name: entityData.master_entity_name,
            structure: deal.type !== "fund" ? "LLC" : "LP",
            organization_ids: [newOrg._id],
          });
        } catch (e: any) {
          await Organization.findByIdAndDelete(newOrg._id);
          throw new HttpError(`Entity creation failed: ${e}`, 400);
        }

        try {
          await createMemorandumOfUnderstanding({
            deal,
            organization: newOrg,
            user,
            preview: true,
          });
        } catch (e: any) {
          await Organization.findByIdAndDelete(newOrg._id);
          await Entity.findByIdAndDelete(entity._id);
          throw new HttpError(`MOU creation failed: ${e}`, 400);
        }
      } else {
        // gets the Atomizer master entity
        (await Entity.findOneAndUpdate(
          {
            _id: new mongoose.Types.ObjectId(process.env.ATOMIZER_ID),
          },
          { $push: { organization_ids: newOrg._id } }
        )) as Entity;
      }

      if (!isSuperAdmin) {
        await OrganizationAdmin.create({
          user_email: user.email,
          user_id: user._id,
          organization_id: newOrg._id,
        });
      }

      res.send({ organization: newOrg });
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  .post("/migration", async (req, res, next) => {
    try {
      const newOrg = await Organization.create(req.body);
      return res.send(newOrg);
    } catch (e: any) {
      next(e);
    }
  })

  .get("/deals", async (req, res, next) => {
    try {
      const organization = await Organization.findOne(req.query).lean();
      if (!organization) {
        throw new HttpError("Organization not found", 404);
      }
      const deals = await Deal.aggregate([
        {
          $match: {
            organization_id: organization._id,
            phase: { $ne: "archived" },
          },
        },
      ]);
      res.send({ ...organization, deals });
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })
  .get("/:id", async (req, res, next) => {
    const id = req.params.id;
    try {
      const organization = await Organization.findById(id);

      if (!organization) {
        throw new HttpError(`Organization with id ${id} not found`, 404);
      }
      res.send(organization);
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  .get("/check/:name", async (req, res, next) => {
    try {
      const orgName = req.params.name;
      const organization = await Organization.findOne({ name: orgName });
      if (organization) {
        throw new HttpError(
          `Organization with name '${organization.name}' already exists`,
          404
        );
      }
      res.send({ message: "Available name" });
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })
  .put("/:id", async (req, res, next) => {
    const id = req.params.id;
    try {
      const updatedOrg = await Organization.findOneAndUpdate(
        { _id: id },
        req.body,
        { new: true }
      );
      res.send(updatedOrg);
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })
  .delete("/:id", async (req, res, next) => {
    const id = req.params.id;
    try {
      const deletedOrg = await Organization.deleteOne({ _id: id });

      if (!deletedOrg) {
        throw new HttpError(`Organization with id ${id} not found`, 404);
      }
      res.send(deletedOrg);
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })
  .get("/", async (req, res, next) => {
    try {
      const organizations = await Organization.find(req.query);
      res.send(organizations);
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  });
