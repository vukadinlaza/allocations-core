/* eslint-disable @typescript-eslint/no-non-null-assertion */
import fetch from "node-fetch";
import { Investment } from "@allocations/core-models";
import { NameScanData } from "./utils/namescan";
const { AIRTABLE_API_KEY, AIRTABLE_DEAL_TRACKER_BASE_ID } = process.env;

const AIRTABLE_DEALS_TABLE_ID = "Deals";
const AIRTABLE_USERS_TABLE_ID = "Users";
const AIRTABLE_DEAL_TRACKER_TABLE_ID =
  process.env.AIRTABLE_DEAL_TRACKER_TABLE_ID || "Deal Tracker STAGING";

if (!AIRTABLE_DEAL_TRACKER_BASE_ID || !AIRTABLE_DEAL_TRACKER_BASE_ID) {
  throw new Error(
    `Environment variables AIRTABLE_API_KEY and  AIRTABLE_DEAL_TRACKER_BASE_ID are required`
  );
}

type RecordId = string;

type DealTrackerInvestment = {
  record_id: RecordId;
  "Investor Name"?: string;
  Email?: string[];
  "Total Amount Committed (without fees)"?: number;
  "Total Amount Committed (with fees)"?: number;
  "Deal Name (webapp)"?: string[];
  "Investor Name/Entity"?: string;
  "Investor Type"?: string;
  "Investor State"?: string;
  "Wire Name"?: string[];
  "Investor Country"?: string;
  "Accredited Investor"?: string;
  "Capital Call"?: boolean;
  "Upcoming Capital Call Date"?: string;
  "SPV/Fund Name Lookup"?: string[];
  "Upcoming Capital Call (%)"?: number;
  "*Bank Account Name (from Wire Feed)"?: string[];
  "*Date (from Wire Feed)"?: string[];
  "*Investor Name (from Wire Feed)"?: string[];
  "Type (from Bookings by month)"?: string[]; // Fund, Entity, Individual
  "Portfolio Wire Date (from Bookings by month)"?: string[];
  "SPV/Fund Name (from Bookings by month)"?: string[];
  "*Contribution 1 (from Wire Feed)"?: string[];
  "Net Amount Contributed"?: number | string;
  "Aggregate Contributed (%)"?: number;
  "Gross Contribution Outstanding (%)"?: number | string;
  "Upcoming Capital Call Amount"?: number;
  "Deal ID"?: string[];
  "Mongo Investment ID"?: string;
  "Blue Sky Fees"?: number;
  createdTime?: string;
  "KYC Complete"?: string;
  "KYC Result"?: string[];
  "KYC Scan Meta Data"?: string;
};

const getNameOrEntity = (investment: Investment) => {
  return investment.investor_type === "Entity"
    ? investment.investor_entity_name
    : investment.investor_name;
};

const findDealRecordId = async (deal_id: string): Promise<RecordId> => {
  const filterByFormula = encodeURIComponent(`FIND("${deal_id}", {deal_id})`);
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_DEAL_TRACKER_BASE_ID}/${AIRTABLE_DEALS_TABLE_ID}?filterByFormula=${filterByFormula}`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    }
  );

  if (!res.ok) throw new Error("Failed to fetch from Deals Airtable");

  const { records } = await res.json();
  if (!records.length)
    throw new Error(`Unable to find deal with id ${deal_id}`);

  return records[0].id;
};

const findUserRecordId = async (user_id: string): Promise<RecordId> => {
  const filterByFormula = encodeURIComponent(`FIND("${user_id}", {_id})`);
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_DEAL_TRACKER_BASE_ID}/${AIRTABLE_USERS_TABLE_ID}?filterByFormula=${filterByFormula}`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    }
  );

  if (!res.ok) throw new Error("Failed to fetch from Users Airtable");

  const { records } = await res.json();
  if (!records.length)
    throw new Error(`Unable to find user with id ${user_id}`);

  return records[0].id;
};

export const createInvestment = async (
  investment: Investment
): Promise<DealTrackerInvestment> => {
  const deal_record_id = await findDealRecordId(
    investment.metadata.get("deal_id")
  );

  const user_record_id = await findUserRecordId(investment.user_id.toString());

  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_DEAL_TRACKER_BASE_ID}/${AIRTABLE_DEAL_TRACKER_TABLE_ID}`,
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
              "Investor Name": investment.investor_name,
              "Deal Name (webapp)": [deal_record_id],
              Email: [user_record_id],
            },
          },
        ],
      }),
    }
  );

  if (!res.ok) {
    throw new Error("Failed to create deal tracker investment on Airtable");
  }

  const { records } = await res.json();
  return { record_id: records[0].id, ...records[0].fields };
};

export const updateSignedInvestment = async (
  investment: Investment
): Promise<DealTrackerInvestment> => {
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_DEAL_TRACKER_BASE_ID}/${AIRTABLE_DEAL_TRACKER_TABLE_ID}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            id: investment.metadata.get("deal_tracker_record_id"),
            fields: {
              "Carry %": investment.carry_fee_percent,
              "Management Fee %": investment.management_fee_percent,
              "Investor Type": investment.investor_type,
              "Investor Name/Entity": getNameOrEntity(investment),
              "Investor Country": investment.investor_country,
              "Accredited Investor": investment.accredited_investor_type,
              "Investor State": investment.investor_state,
              "Total Amount Committed (without fees)":
                investment.total_committed_amount,
              "Mongo Investment ID": investment._id,
            },
          },
        ],
      }),
    }
  );
  if (!res.ok) throw new Error("Failed to update Airtable");

  const { records } = await res.json();
  return { record_id: records[0].id, ...records[0].fields };
};

export const findDealTrackerInvestment = async (
  investment: Investment
): Promise<DealTrackerInvestment | null> => {
  const deal_id = investment.metadata.get("deal_id");

  const name =
    investment.investor_type === "Entity" ||
    investment.investor_type === "Trust"
      ? investment.investor_entity_name
      : investment.investor_name;

  const nameOrEntity = getNameOrEntity(investment);
  const filterByFormula = encodeURIComponent(
    `AND(FIND("${investment.user_id}", {Mongo User ID}), FIND("${deal_id}", {deal_id}), FIND("${name}", {Investor Name/Entity}))`
  );
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_DEAL_TRACKER_BASE_ID}/${AIRTABLE_DEAL_TRACKER_TABLE_ID}?filterByFormula=${filterByFormula}`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    }
  );

  if (!res.ok) throw new Error("Failed to fetch from Airtable");

  const { records } = (await res.json()) as any;
  const record = records.reduce((foundRecord: any, record: any) => {
    if (record["Investor Name/Entity"] === nameOrEntity) return record;
    else if (!foundRecord && !record["Investor Name/Entity"]) return record;
    else return record;
  }, null);
  if (!record) return null;

  return { record_id: record.id, ...record.fields };
};

export const createOrFindDealTrackerInvestment = async (
  investment: Investment
): Promise<DealTrackerInvestment> => {
  const dealTrackerInvestment = await findDealTrackerInvestment(investment);
  if (dealTrackerInvestment) return dealTrackerInvestment;

  return createInvestment(investment);
};

export const updateBlueSkyFees = async (
  investment: Investment,
  newFeeValue: string
): Promise<DealTrackerInvestment> => {
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_DEAL_TRACKER_BASE_ID}/${AIRTABLE_DEAL_TRACKER_TABLE_ID}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            // @ts-ignore
            id: investment.id,
            fields: {
              "Blue Sky Fees": newFeeValue,
            },
          },
        ],
      }),
    }
  );

  if (!res.ok)
    throw new Error("Failed to update Airtable with Blue Sky fee state value");

  const { records } = await res.json();
  return { record_id: records[0].id, ...records[0].fields };
};

export const getDealTrackerDealRecords = async (
  deal_id: string
): Promise<DealTrackerInvestment | null> => {
  const filterByFormula = encodeURIComponent(
    `AND(FIND("${deal_id}", {deal_id}))`
  );
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_DEAL_TRACKER_BASE_ID}/${AIRTABLE_DEAL_TRACKER_TABLE_ID}?filterByFormula=${filterByFormula}`,
    {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    }
  );

  if (!res.ok) throw new Error("Failed to fetch from Airtable");

  const { records } = (await res.json()) as any;

  return records.map((r: any) => {
    return {
      id: r.id,
      ...r.fields,
    };
  });
};

export const updateKYCData = async (
  investment: Investment,
  nameScanData: NameScanData
): Promise<DealTrackerInvestment> => {
  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_DEAL_TRACKER_BASE_ID}/${AIRTABLE_DEAL_TRACKER_TABLE_ID}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        records: [
          {
            id: investment.metadata.get("deal_tracker_record_id"),
            fields: {
              "KYC Complete": nameScanData?.scanned,
              "KYC Result": nameScanData?.singleHitType || "N/A",
              "KYC Scan Meta Data": nameScanData?.metaData,
            },
          },
        ],
      }),
    }
  );

  if (!res.ok) throw new Error("Failed to update Airtable KYC Data");

  const { records } = await res.json();
  return { record_id: records[0].id, ...records[0].fields };
};
