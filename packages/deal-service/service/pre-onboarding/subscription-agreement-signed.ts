import { connectMongoose, triggerCheck } from "@allocations/service-common";
import type { S3Event } from "aws-lambda";
import {
  DealPhase,
  SubscriptionTemplate,
  Document,
  Deal,
} from "@allocations/core-models";
import fetch from "node-fetch";
import { createInvestorTemplate } from "../../src/utils/docspring";
import logger from "../../logger";

export const handler = async ({ Records }: S3Event) => {
  await connectMongoose();
  for (const record of Records) {
    const path = record.s3.object.key;
    const [, , , dealId] = path.split("/");
    const document = await Document.findOneAndUpdate(
      {
        deal_id: dealId,
        bucket: record.s3.bucket.name,
        path,
      },
      { complete: true },
      { new: true }
    );
    if (!document) {
      throw new Error(
        `Unable to find document for ${dealId} at ${path} in ${record.s3.bucket.name}`
      );
    }

    const phase = await DealPhase.findOneAndUpdate(
      {
        deal_id: dealId,
        name: "pre-onboarding",
        "tasks.title": "Sign Subscription Agreement",
      },
      {
        "tasks.$.complete": true,
        metadata: { signed_subscription_agreement_id: document._id },
      },
      { new: true }
    );

    if (!phase)
      throw new Error(
        `Unable to find Pre-Onboarding phase for deal with id ${dealId}`
      );

    const deal = await Deal.findById(dealId);

    if (!deal) throw new Error(`Unable to find deal with id ${dealId}`);

    const subscriptionTemplate = await SubscriptionTemplate.findById(
      deal.subscription_agreement?.docspring_base_template_id
    );

    if (!subscriptionTemplate)
      throw new Error(
        `Unable to template with id ${deal.subscription_agreement?.docspring_base_template_id}`
      );

    if (deal && document && subscriptionTemplate) {
      await createInvestorTemplate(subscriptionTemplate, deal, document);
    }

    //SLACK Notification for Ops
    const zapBody = {
      fm_email: deal.manager?.email, // The notification will show the deal manager, but also other managers or allocations admins can sign (just to keep in mind)
      organization: deal.organization_name,
      deal: deal.name || deal.portfolio_company_name,
      ops_tools_deal_url: `https://ops.allocations.com/deals/${deal._id}`,
    };

    const zapierRes = await fetch(
      process.env.ZAPIER_FM_SUB_AGREEMENT_SIGNED_HOOK!,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(zapBody),
      }
    );

    if (!zapierRes.ok) logger.info({ zapBody }, "Slack Notification not sent");

    await triggerCheck({
      id: deal._id.toString(),
      check_id: phase._id.toString(),
      phase: phase.name,
    });
  }
};
