/* eslint-disable @typescript-eslint/no-non-null-assertion */
import fetch from "node-fetch";
import { InvestorPassport, TaxInformation } from "@allocations/core-models";
const { AIRTABLE_API_KEY, AIRTABLE_LP_ENTITIES_BASE_ID } = process.env;

const AIRTABLE_LP_ENTITIES_RAW_ID = "LP Entity Master - RAW";

if (!AIRTABLE_LP_ENTITIES_BASE_ID) {
  throw new Error(
    `Environment variable AIRTABLE_LP_ENTITIES_BASE_ID is required`
  );
}

export const createATLPEntitiesRow = async (
  passport: InvestorPassport,
  taxInformation: TaxInformation
) => {
  const { tax_form, type, _id: taxInformationId } = taxInformation;

  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_LP_ENTITIES_BASE_ID}/${AIRTABLE_LP_ENTITIES_RAW_ID}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              Name: passport.name,
              SSN: (tax_form as any).ssn,
              Type: type,
              "Tax Class": (tax_form as any).company_type,
              SMLLC: !!(tax_form as any).smllc_name,
              "SMLLC Owner": (tax_form as any).smllc_owner_name,
              "Beneficial Owner TIN": (tax_form as any).tax_id,
              "Foreign TIN": (tax_form as any).foreign_tax_id,
              "Street Address": (tax_form as any).address,
              "City/Town": (tax_form as any).city,
              State: (tax_form as any).state,
              ZIP: (tax_form as any).postal_code,
              Region: (tax_form as any).region,
              Country: (tax_form as any).country,
              "Chapter 3": (tax_form as any).chapter3_status,
              "Chapter 4": (tax_form as any).chapter4_status,
              "MongoDB Passport ID": passport._id,
              "MongoDB Tax Information ID": taxInformationId,
            },
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to create row in LP Entities on Airtable");
  }

  const { records } = await res.json();
  return { record_id: records[0].id, ...records[0].fields };
};

export const findRowInLPEntities = async (taxInformationId: string) => {
  const filterByFormula = encodeURIComponent(
    `FIND("${taxInformationId}", {MongoDB Tax Information ID})`
  );
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_LP_ENTITIES_BASE_ID}/${AIRTABLE_LP_ENTITIES_RAW_ID}?filterByFormula=${filterByFormula}`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    }
  );

  if (!res.ok) throw new Error("Failed to fetch from LP Entities Airtable");

  const { records } = await res.json();

  return records?.[0]?.id;
};
