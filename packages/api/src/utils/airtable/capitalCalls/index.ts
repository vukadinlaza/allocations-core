//@ts-nocheck
const Airtable = require("airtable");
Airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: process.env.AIRTABLE_API_KEY,
});

const getBase = async () => {
  return Airtable.base(process.env.CAPITAL_CALLS_AIRTABLE_BASE);
};

export const getCapCallsData = async (deal_id: string) => {
  try {
    const filterByFormula = `FIND("${deal_id}", {deal_id})`;
    const base = await getBase();
    const dealTracker = await base.table("Deal Tracker");
    const dealTrackerDealRecords = await dealTracker
      .select({ filterByFormula: filterByFormula })
      .all();

    const records = dealTrackerDealRecords
      .map((r: { fields: []; id: string }) => ({
        ...r.fields,
        atId: r.id,
      }))
      .map((r) => {
        const total_committed = r["Total Amount Committed (with fees)"];
        const total_wired = r["Net Amount Contributed"];
        const total_remaining_available = total_committed - total_wired;
        const current_draw_down = r["Upcoming Capital Call Amount"];
        const investor_name = r["Investor Name"];
        const gross_capital_outstanding =
          r["Gross Contribution Outstanding (%)"];
        const completed = r["Upcoming Capital Call Status - DB"].includes(
          "Pending"
        )
          ? false
          : true;
        const due_date = r["Upcoming Capital Call Date"];
        return {
          total_committed,
          total_wired,
          total_remaining_available,
          current_draw_down,
          investor_name,
          completed,
          due_date,
        };
      });
    return records;
  } catch (err) {
    console.log(err);
  }
};
