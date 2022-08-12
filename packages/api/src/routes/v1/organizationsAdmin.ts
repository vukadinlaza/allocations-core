import { Router } from "express";
import { Organization, OrganizationAdmin } from "@allocations/core-models";
import mongoose from "mongoose";
import logger from "../../../logger";
import { basename } from "path";
import { ObjectId } from "mongodb";
const fileName = basename(__filename, ".ts");
const log = logger.child({ module: fileName });

export default Router()
  .post("/:org_id", async (req, res, next) => {
    const { users } = req.body;

    try {
      const newOrgAdmins: OrganizationAdmin[] = await Promise.all(
        users.map(async (user: any) => {
          const matchingAdmin = await OrganizationAdmin.findOne({
            user_id: user._id,
            organization_id: req.params.org_id,
          }).lean();

          if (matchingAdmin) return matchingAdmin;

          const newAdmin = await OrganizationAdmin.create({
            user_email: user.email,
            user_id: user._id,
            organization_id: req.params.org_id,
          });
          return newAdmin;
        })
      );

      res.send(newOrgAdmins);
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })
  // gets all organizations the user is an admin of
  .post("/user/:user_id", async (req, res, next) => {
    try {
      const { user } = req.body;
      const superAdmin = await OrganizationAdmin.findOne({
        user_id: req.params.user_id,
        super_admin: true,
      });

      if (superAdmin || user?.admin) {
        const allOrgs = await Organization.find();
        return res.send(allOrgs);
      }

      const organizations = await OrganizationAdmin.aggregate([
        {
          $match: { user_id: new mongoose.Types.ObjectId(req.params.user_id) },
        },
        {
          $lookup: {
            from: "organizations",
            localField: "organization_id",
            foreignField: "_id",
            as: "organization",
          },
        },
        {
          $unwind: {
            path: "$organization",
          },
        },
        {
          $project: {
            _id: "$organization._id",
            name: "$organization.name",
            slug: "$organization.slug",
            high_volume_partner: "$organization.high_volume_partner",
            created_at: "$organization.created_at",
            updated_at: "$organization.updated_at",
            master_series: "$organization.master_series",
          },
        },
      ]);

      if (!organizations[0]) {
        log.info("User is not admin of any organizations");
      }

      res.send(organizations);
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })
  .get("/:org_id", async (req, res, next) => {
    try {
      const admins = await OrganizationAdmin.find({
        organization_id: req.params.org_id,
      });
      res.send(admins);
    } catch (e: any) {
      next(e);
    }
  })
  .delete("/:org_id/:user_id", async (req, res, next) => {
    try {
      const deletedAdmin = await OrganizationAdmin.findOneAndDelete({
        organization_id: new ObjectId(req.params.org_id),
        user_id: new ObjectId(req.params.user_id),
      });

      res.send(deletedAdmin);
    } catch (e: any) {
      next(e);
    }
  });
