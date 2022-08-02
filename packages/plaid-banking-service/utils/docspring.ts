import { Organization } from "@allocations/organization-models";
import fetch from "node-fetch";

const TOKEN = Buffer.from(
  `${process.env.DOCSPRING_TOKEN_ID}:${process.env.DOCSPRING_TOKEN_SECRET}`
).toString("base64");

export const createSubmission = async ({
  templateId,
  organization,
  assetType,
}: {
  templateId: string;
  organization: Organization;
  assetType:
    | "services-agreement"
    | "memorandum-of-understanding"
    | "master-series-llc-agreement";
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
        data: organization,
        metadata: {
          assetType,
          organizationId: organization._id,
        },
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to make docspring submission: ${await res.text()}`);
  }

  return res.json();
};

export const createServicesAgreement = (organization: Organization) => {
  return createSubmission({
    organization,
    assetType: "services-agreement",
    templateId: "tpl_JRTdSjKnF3kXZQKFdE",
  });
};

export const createMOUAgreement = (organization: Organization) => {
  return createSubmission({
    organization,
    assetType: "memorandum-of-understanding",
    templateId: "tpl_JRTdSjKnF3kXZQKFdE",
  });
};
