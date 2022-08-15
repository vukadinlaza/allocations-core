import { Entity, InvestorPassport } from "@allocations/core-models";
import fetch from "node-fetch";

const TOKEN = Buffer.from(
  `${process.env.DOCSPRING_TOKEN_ID}:${process.env.DOCSPRING_TOKEN_SECRET}`
).toString("base64");

export const createSubmission = async ({
  templateId,
  entity,
  assetType,
}: {
  templateId: string;
  entity: Entity;
  assetType: "master-series-llc-agreement";
}) => {
  const res = await fetch(
    `https://api.docspring.com/api/v1/templates/${templateId}/submissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        test: process.env.DOCSPRING_ENVIRONMENT !== "production",
        data: entity,
        metadata: {
          assetType,
          model: "entity",
          modelId: entity._id,
          title: `${assetType}.pdf`,
        },
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to make docspring submission: ${await res.text()}`);
  }

  return res.json();
};

export const createMasterSeriesAgreement = (
  entity: Entity & { manager: InvestorPassport; member: InvestorPassport }
) => {
  return createSubmission({
    entity,
    assetType: "master-series-llc-agreement",
    templateId: "tpl_NnQxQZ7rFqrmT3Khpx",
  });
};
