import { InvestorPassport } from "@allocations/core-models";
import fetch from "node-fetch";

const PASSABLE_HIT_TYPES = ["PEP", "RCA"];

const getNameScan = async (investorPassport: InvestorPassport) => {
  const data = {
    name: investorPassport.name,
    country: investorPassport.country || "",
    matchRate: 90,
  };

  const res = await fetch(
    `https://namescan.io/api/v3/${
      investorPassport.type === "Entity" ? "organization-scans" : "person-scans"
    }/emerald`,
    {
      method: "POST",
      headers: {
        "api-key": process.env.NAME_SCAN_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  if (!res.ok) {
    throw new Error(
      `Failed to create NameScan scan for Investor Passport KYC id: ${investorPassport.id}`
    );
  }

  return res.json();
};

const evaluateNameScanData = (hits: { category: string }[]) => {
  return {
    passed: hits.every(({ category }) => PASSABLE_HIT_TYPES.includes(category)),
    hits,
  };
};

const getPersonalNameScan = async (investorPassport: InvestorPassport) => {
  const { persons, numberOfMatches } = await getNameScan(investorPassport);
  if (!numberOfMatches)
    return {
      passed: true,
      hits: [],
    };

  return evaluateNameScanData(persons);
};

const getOrganizationNameScan = async (investorPassport: InvestorPassport) => {
  const { organizations, numberOfMatches } = await getNameScan(
    investorPassport
  );
  if (!numberOfMatches)
    return {
      passed: true,
      hits: [],
    };

  return evaluateNameScanData(organizations);
};

export const getNameScanData = async (investorPassport: InvestorPassport) => {
  if (investorPassport.test) {
    return {
      passed: true,
      hits: [],
    };
  }

  return investorPassport.type === "Individual"
    ? getPersonalNameScan(investorPassport)
    : getOrganizationNameScan(investorPassport);
};
