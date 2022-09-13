import { Organization } from "@allocations/core-models";
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
    | "terms-and-conditions"
    | "services-agreement"
    | "power-of-attorney"
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
          model: "organizations",
          modelId: organization._id,
          title: `${assetType}.pdf`,
        },
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Failed to make DocSpring submission: ${await res.text()}`);
  }

  return res.json();
};

export const createTermsAgreement = (organization: Organization) => {
  return createSubmission({
    organization,
    assetType: "terms-and-conditions",
    templateId: "tpl_2hE5JMxXGcdE5S4tsR",
  });
};

export const createServicesAgreement = (organization: Organization) => {
  return createSubmission({
    organization,
    assetType: "services-agreement",
    templateId: "tpl_XhkcmkyQxKxLDpfsdN",
  });
};

export const createPOAAgreement = (organization: Organization) => {
  return createSubmission({
    organization,
    assetType: "power-of-attorney",
    templateId: "tpl_gXk2AEDGkkT2CDQDQK",
  });
};

export const createMOUAgreement = (
  organization: Organization & {
    address: string;
    email: string;
    number_of_deals_to_words: string;
  }
) => {
  return createSubmission({
    organization,
    assetType: "memorandum-of-understanding",
    templateId: "tpl_JRTdSjKnF3kXZQKFdE",
  });
};
