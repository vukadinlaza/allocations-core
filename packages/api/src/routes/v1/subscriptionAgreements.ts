import { Router } from "express";
import { SubscriptionTemplate, Deal } from "@allocations/core-models";
import { HttpError, logger } from "@allocations/api-common";
import { basename } from "path";
import { getTemplateData, addTemplateFields } from "../../utils/docspring";
import { getFieldPlacement } from "../../utils/pagefinder";
const fileName = basename(__filename, ".ts");
const log = logger.child({ module: fileName });

export default Router()
  .get("/", async (_, res, next) => {
    try {
      const allTemplates = await SubscriptionTemplate.find();
      res.send(allTemplates);
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  .get("/:template_id", async (req, res, next) => {
    try {
      const template = await SubscriptionTemplate.findOne({
        _id: req.params.template_id,
      });
      if (!req.params.template_id) {
        res.status(400);
        throw new Error(`No template ${req.params.template_id} exists`);
      }
      res.send({ template });
    } catch (e) {
      console.error(e);
      next(e);
    }
  })

  .post("/create-template/:deal_id", async (req, res, next) => {
    try {
      const deal = await Deal.findById(req.params.deal_id).lean();
      if (!deal) {
        throw new HttpError(
          `No deal found for ID:  ${req.params.deal_id}`,
          404
        );
      }

      if (!deal.subscription_agreement?.docspring_presign_template_id) {
        throw new HttpError(`No FM template on the Deal: ${deal._id}`, 400);
      }

      const templateData = await SubscriptionTemplate.findById(
        deal.subscription_agreement.docspring_base_template_id
      ).lean();
      if (!templateData) {
        throw new HttpError(
          `No SubscriptionTemplate missing for ${deal._id}`,
          400
        );
      }

      if (templateData.docspring?.fm_fields) {
        if (!deal?.subscription_agreement)
          throw new Error(
            `Cant get template data. No docspring_presign_template_id found`
          );

        const { docspring_presign_template_id, field_injection_strategy } =
          deal.subscription_agreement;
        const submission = await getTemplateData(docspring_presign_template_id);

        const fieldsPlacements = await getFieldPlacement(
          submission.document_url,
          templateData.docspring.fm_fields,
          field_injection_strategy
        );

        await addTemplateFields(
          deal.subscription_agreement.docspring_presign_template_id,
          fieldsPlacements
        );
      }

      res.send({ deal });
    } catch (e) {
      console.error(e);
      next(e);
    }
  });
