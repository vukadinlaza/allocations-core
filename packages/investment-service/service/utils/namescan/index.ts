import fetch from "node-fetch";
import { Investment } from "@allocations/core-models";

export type NameScanData = {
  numMatches: number;
  scanned: boolean;
  hitTypes: string[];
  singleHitType: string;
  metaData: string;
};

export const getNameScanData = async (investment: Investment) => {
  const data = {
    name: investment.investor_entity_name,
    country: investment.investor_country || "",
    state: investment.investor_state || "",
  };
  const res = await fetch(
    `https://namescan.io/api/v3/${
      investment.investor_type === "Entity"
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
