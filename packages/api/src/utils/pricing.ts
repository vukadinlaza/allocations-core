import { Deal } from "@allocations/core-models";

export const getSetupCost = (deal: Deal) => {
  if (deal.type === "fund") {
    return deal.number_of_investments >= 30 ? 15000 : 26000;
  } else if (deal.type === "acquisition") return 12000;
  else if (deal.asset_type === "Micro") return 3500;
  else if (deal.asset_type !== "Startup" || deal.custom_investment_agreement)
    return 14000;
  else if (deal.asset_type === "Startup") return 8000;
  else return 10000;
};

export const getAdviserFee = (deal: Deal) => {
  const calculateAdviserFee = (deal: Deal): number => {
    if (deal.type === "fund") return 2000;
    if (deal.asset_type !== "Startup") {
      if (deal.target_raise_goal <= 100000) return 2000;
      if (100001 <= deal.target_raise_goal && deal.target_raise_goal <= 250000)
        return 4000;
      if (250001 <= deal.target_raise_goal && deal.target_raise_goal <= 500000)
        return 8000;
      if (500001 <= deal.target_raise_goal && deal.target_raise_goal <= 1000000)
        return 18000;
      if (1000001 <= deal.target_raise_goal) return 50000;
    }

    return 2000;
  };

  if (deal.asset_type === "Micro") return 1000;

  if (deal.type === "fund") {
    return deal.number_of_investments >= 30 ? 1500 : 2000;
  }
  return deal.reporting_adviser === "Sharding Advisers LLC" ||
    !deal.reporting_adviser
    ? calculateAdviserFee(deal)
    : 0;
};

export const investorFeeMap: { [key: string]: string } = {
  Micro: "Over 20 Investors",
  Startup: "Over 35 Investors",
  default: "Over 50 Investors",
};
