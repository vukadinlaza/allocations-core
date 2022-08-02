import type { APIGatewayEvent } from "aws-lambda";
import fetch from "node-fetch";
import crypto from "node:crypto";

const HUBSPOT_URL = "https://api.hubapi.com/crm/v3/objects";

const MAX_ALLOWED_TIMESTAMP = 1000 * 60 * 5; // 5 minutes in milliseconds

export const findHubspotCompanyByName = async (name: string) => {
  const res = await fetch(
    `${HUBSPOT_URL}/companies/search?hapikey=${process.env.HUBSPOT_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: "name",
                operator: "EQ",
                value: name,
              },
            ],
          },
        ],
      }),
    }
  );

  return res.json();
};

export const findHubspotContactByEmail = async (email: string) => {
  const res = await fetch(
    `${HUBSPOT_URL}/contacts/search?hapikey=${process.env.HUBSPOT_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filterGroups: [
          {
            filters: [
              {
                propertyName: "email",
                operator: "EQ",
                value: email,
              },
            ],
          },
        ],
      }),
    }
  );

  return res.json();
};

export const createHubspotCompany = async (name: string) => {
  const res = await fetch(
    `${HUBSPOT_URL}/companies?hapikey=${process.env.HUBSPOT_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          name: name,
        },
      }),
    }
  );

  if (!res.ok) throw new Error(`Unable to create new Company in Hubspot`);

  return res.json();
};

export const createHubspotContact = async (user: any) => {
  const res = await fetch(
    `${HUBSPOT_URL}/contacts?hapikey=${process.env.HUBSPOT_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          firstname: user.first_name,
          lastname: user.last_name,
          email: user.email,
        },
      }),
    }
  );

  if (!res.ok) throw new Error(`Unable to create new Hubspot Contact`);

  return res.json();
};

export const createHubspotDeal = async (name: string) => {
  const res = await fetch(
    `${HUBSPOT_URL}/deals?hapikey=${process.env.HUBSPOT_API_KEY}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          dealname: name,
          dealstage: process.env.HUBSPOT_START_TRIAL_STAGE,
          pipeline: process.env.HUBSPOT_DEAL_PIPELINE,
        },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(
      `Unable to create new Deal in Hubspot: ${await res.text()}`
    );
  }

  return res.json();
};

export const hubspotAssociateContactToCompany = async (
  contactId: string,
  companyId: string
) => {
  // contact to company association typeId = 1
  await fetch(
    `${HUBSPOT_URL}/contact/${contactId}/associations/company/${companyId}/1?hapikey=${process.env.HUBSPOT_API_KEY}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};

export const hubspotAssociateDealToContact = async (
  dealId: string,
  contactId: string
) => {
  // deal to contact association typeId = 3
  await fetch(
    `${HUBSPOT_URL}/deal/${dealId}/associations/contact/${contactId}/3?hapikey=${process.env.HUBSPOT_API_KEY}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
};

export const validateHubspotRequest = (event: APIGatewayEvent) => {
  const { httpMethod: method, body, headers, requestContext: url } = event;

  const signatureHeader = headers["X-HubSpot-Signature-v3"] ?? "";
  const timestamp: any = headers["X-HubSpot-Request-Timestamp"];

  const currentTime = Date.now();

  if (currentTime - timestamp > MAX_ALLOWED_TIMESTAMP) {
    throw new Error("Timestamp is invalid - Reject request");
  }

  const uri = `https://${headers.Host}${url.path}`;
  const rawString = `${method}${uri}${body}${timestamp}`;

  const hashedString = crypto
    .createHmac("sha256", process.env.HUBSPOT_CLIENT_SECRET!)
    .update(rawString)
    .digest("base64");

  if (
    !crypto.timingSafeEqual(
      Buffer.from(hashedString),
      Buffer.from(signatureHeader)
    )
  ) {
    throw new Error("Signature does not match: request is invalid");
  } else {
    return true;
  }
};
