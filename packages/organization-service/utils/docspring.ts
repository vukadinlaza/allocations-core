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

export const createPOAAgreement = (
  organization: Organization & {
    fund_manager: string;
    title: string;
    intro: string;
  }
) => {
  organization.intro = `Any capitalized terms shall have the meaning ascribed to them in the Master Services Agreement and/or the respective Order Form by and between ${organization.name} (the “Company”), ${organization.fund_manager} (the "Individual") and Allocations, concluded on the date indicated below in the signature page.`;

  return createSubmission({
    organization,
    assetType: "power-of-attorney",
    templateId: "tpl_PCPFGFrm3Mrdr9dH5H",
  });
};

export const createMOUAgreement = (
  organization: Organization & {
    address: string;
    email: string;
    number_of_deals_to_words: string;
    company_commitment: string;
  }
) => {
  organization.company_commitment = `A minimum of ${organization.number_of_deals_to_words} (${organization.committed_number_of_deals}) SPVs, as detailed in each applicable Services Agreement.`;

  return createSubmission({
    organization,
    assetType: "memorandum-of-understanding",
    templateId: "tpl_JRTdSjKnF3kXZQKFdE",
  });
};
