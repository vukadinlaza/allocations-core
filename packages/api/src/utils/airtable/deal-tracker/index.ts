//@ts-nocheck
const Airtable = require("airtable");
Airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: process.env.AIRTABLE_API_KEY,
});

const getBase = async () => {
  return Airtable.base(process.env.AIRTABLE_DEAL_TRACKER_BASE_ID);
};

export const findDealRecord = async (deal_id: string) => {
  const filterByFormula = `FIND("${deal_id}", {deal_id})`;
  const base = await getBase();
  const deals = await base.table("Deals");

  const response = await deals.select({ filterByFormula }).all();

  return response;
};

export const createDealRecord = async (body: {
  deal_id: string;
  organization: string;
  deal_name: string;
}) => {
  const { deal_id, deal_name, organization } = body;

  const base = await getBase();
  const deals = await base.table("Deals");

  return deals.create([
    {
      fields: {
        "Deal Name": deal_name,
        Organization: organization,
        deal_id: deal_id,
      },
    },
  ]);
};
