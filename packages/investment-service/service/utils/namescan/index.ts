import fetch from "node-fetch";
import { Investment, InvestorPassport } from "@allocations/core-models";

export type NameScanData = {
  numMatches: number;
  scanned: boolean;
  hitTypes: string[];
  singleHitType: string;
  metaData: string;
};

export const getNameScanData = async (investment: Investment & {passport: InvestorPassport}) => {
  const data = {
    name: investment.passport.type === "Entity" ? investment.passport.name : null,
    country: investment.passport.country || "",
    state: investment.passport.us_state || "",
  };
  const res = await fetch(
    `https://namescan.io/api/v3/${
      investment.passport.type === "Entity"
        ? "organisation-scans"
        : "person-scans"
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

  console.log("RES", res);

  if (!res.ok) {
    throw new Error("Failed to create NameScan scan for investment");
  }

  const nameScanRes = await res.json();
  const hitTypes =
    (nameScanRes?.persons || []).map((p: { category: string }) => p.category) ||
    [];
  const numberOfMatches = nameScanRes?.numberOfMatches;
  const goodScanTypes = ["PEP", "RCA"];
  const nameScanData = {
    numMatches: numberOfMatches,
    scanned:
      numberOfMatches === 0
        ? true
        : numberOfMatches === 1 && goodScanTypes.includes(hitTypes[0])
        ? true
        : false,
    hitTypes,
    singleHitType: numberOfMatches === 1 ? hitTypes[0] : "N/A",
    metaData: JSON.stringify(nameScanRes),
  };

  return nameScanData;
};
