import { HttpError } from "@allocations/api-common";
import {
  Entity,
  EntityAgreement,
  Organization,
  OrganizationAgreement,
  OrganizationFundManager,
  OrganizationModerator,
} from "@allocations/core-models";
import { Router } from "express";
import {
  approveOpsHandoff,
  initializeOrganization,
} from "../../services/organizations";

export default Router()
  .post("/", async (req, res, next) => {
    try {
      const {
        name,
        user,
        high_volume_partner,
        desired_entity_name,
        fund_manager_passport_id,
        banking_manager_passport_id,
      } = req.body;

      const newOrg = await Organization.create({
        phase: "new",
        name,
        high_volume_partner,
        desired_entity_name,
      });

      await OrganizationModerator.create({
        user_id: user._id,
        organization_id: newOrg._id,
        role: "admin",
      });

      if (fund_manager_passport_id) {
        await OrganizationFundManager.create({
          passport_id: fund_manager_passport_id,
          organization_id: newOrg._id,
          role: "fund-manager",
        });
      }

      if (banking_manager_passport_id) {
        await OrganizationFundManager.create({
          passport_id: banking_manager_passport_id,
          organization_id: newOrg._id,
          role: "banking-manager",
        });
      }

      res.send(newOrg);

      await initializeOrganization(
        newOrg,
        req.headers["x-api-token"] as string
      );
    } catch (e: any) {
      next(e);
    }
  })

  .get("/", async (req, res, next) => {
    try {
      const organizations = await Organization.find(req.query);
      res.send(organizations);
    } catch (e: any) {
      next(e);
    }
  })

  .get("/totals", async (_, res, next) => {
    try {
      const totals = await Organization.aggregate([
        {
          $group: {
            _id: "$phase",
            count: {
              $sum: 1,
            },
          },
        },
        {
          $project: {
            phase: "$_id",
            count: "$count",
            _id: false,
          },
        },
      ]);
      res.send(totals);
    } catch (e: any) {
      next(e);
    }
  })

  .get("/:id", async (req, res, next) => {
    try {
      const organizationDetails = await Organization.findById(req.params.id)
        .populate("entities")
        .populate("admins")
        .populate("moderators");

      if (!organizationDetails)
        throw new HttpError("Unable to find Organization", 404);

      res.send(organizationDetails);
    } catch (e: any) {
      next(e);
    }
  })

  .post("/:id/ops-approve", async (req, res, next) => {
    try {
      await approveOpsHandoff(
        req.params.id,
        req.headers["x-api-token"] as string
      );
      res.send({ message: "Success" });
    } catch (e: any) {
      next(e);
    }
  })

  .get("/:id/action-items", async (req, res, next) => {
    try {
      const entities = await Entity.find({ organization_id: req.params.id });

      const [organizationAgreements, entityAgreements] = await Promise.all([
        OrganizationAgreement.find({
          organization_id: req.params.id,
          signed: false,
        }),
        EntityAgreement.find({
          entity_id: entities.map(({ _id }) => _id),
          signed: false,
        }),
      ]);

      res.send({
        organization_agreements: organizationAgreements,
        entity_agreements: entityAgreements,
        // TODO add deal action items
      });
    } catch (e: any) {
      next(e);
    }
  });
