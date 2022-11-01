import { Router } from "express";
import {
  APIGatewayClient,
  CreateApiKeyCommand,
  CreateUsagePlanKeyCommand,
  DeleteApiKeyCommand,
} from "@aws-sdk/client-api-gateway";
import { APIKey } from "@allocations/core-models";
import { HttpError, logger } from "@allocations/api-common";

const client = new APIGatewayClient({ region: "us-east-1" });

const planMap: { [key: string]: string } = {
  bronze: "4gg6t6",
  silver: "ofaipi",
  gold: "euty99",
};

export default Router()
  .post("/", async (req, res, next) => {
    try {
      const {
        description,
        organization_id,
        plan,
        test = true,
      }: {
        description?: string;
        organization_id: string;
        plan: string;
        test: boolean;
      } = req.body;
      if (!organization_id) {
        return res.status(400).send("Request body improperly formatted");
      }

      const createKeyCommand = new CreateApiKeyCommand({
        name: `${organization_id}-${Date.now()}`,
        enabled: true,
      });
      const apiKey = await client.send(createKeyCommand);

      if (!apiKey) {
        throw new HttpError("API Key Creation Failed", 500);
      }

      const planId = test ? planMap[plan] : "4gg6t6";

      const createPlanCommand = new CreateUsagePlanKeyCommand({
        usagePlanId: planId,
        keyId: apiKey.id,
        keyType: "API_KEY",
      });
      const createdPlan = await client.send(createPlanCommand);

      if (!createdPlan) {
        throw new HttpError("Plan Association Failed", 500);
      }

      const key = await APIKey.create({
        api_key: apiKey.value,
        key_id: apiKey.id,
        organization_id,
        plan_id: planId,
        description,
        test,
      });

      res.send(key);
    } catch (e) {
      logger.error(e);
      next(e);
    }
  })

  .get("/", async (req, res, next) => {
    try {
      console.log(req.query, "QUERY");
      const keys = await APIKey.find(req.query);
      console.log(keys, "KEYS");
      res.send(keys);
    } catch (e) {
      next(e);
    }
  })

  .get("/:id", async (req, res, next) => {
    try {
      const key = await APIKey.findById(req.params.id);
      if (!key) {
        throw new HttpError("Not Found", 404);
      }
      res.send(key);
    } catch (e) {
      next(e);
    }
  })

  .delete("/:id", async (req, res, next) => {
    try {
      const key = await APIKey.findById(req.params.id).select("+key_id");
      if (!key) {
        throw new HttpError(`API Key with id ${req.params.id} not found`, 404);
      }
      const deleteCommand = new DeleteApiKeyCommand({ apiKey: key.key_id });
      await client.send(deleteCommand);

      await APIKey.findByIdAndDelete(req.params.id);
      res.send({ acknowledged: true });
    } catch (e) {
      next(e);
    }
  });
