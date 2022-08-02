import fetch from "node-fetch";
import { Investment } from "@allocations/core-models";

export const initialize = async (investment: Investment, token: string) => {
  const res = await fetch(`${process.env.INVESTMENT_SERVICE_URL!}/initialize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-TOKEN": token,
    },
    body: JSON.stringify({ id: investment._id }),
  });

  if (!res.ok)
    throw new Error(`Unable to initialize investment: ${investment.id}`);

  return res.json();
};

export const resign = async (investment: Investment, token: string) => {
  const res = await fetch(
    `${process.env.INVESTMENT_SERVICE_URL!}/signed/resign`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-TOKEN": token,
      },
      body: JSON.stringify({ id: investment._id }),
    }
  );

  if (!res.ok) throw new Error(`Unable to resign investment: ${investment.id}`);

  return res.json();
};

export const update = async (
  _id: string,
  investment: Investment,
  token: string
) => {
  const res = await fetch(
    `${process.env.INVESTMENT_SERVICE_URL!}/update-investment/${_id}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "X-API-TOKEN": token,
      },
      body: JSON.stringify(investment),
    }
  );

  if (!res.ok)
    throw new Error(`Unable to update investment: ${investment._id}`);

  return res.json();
};

export const investmentsByDealId = async (dealId: string, token: string) => {
  const res = await fetch(
    `${process.env.INVESTMENT_SERVICE_URL!}/investments-by-deal-id/${dealId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-TOKEN": token,
      },
    }
  );
  if (!res.ok) throw new Error(`Unable to fetch investments: ${dealId}`);

  return res.json();
};

export const getInvestmentAgreementPreview = async (
  token: string,
  investment: Investment
) => {
  const res = await fetch(
    `${process.env.INVESTMENT_SERVICE_URL!}/investment-agreement-preview/`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-TOKEN": token,
      },
      body: JSON.stringify(investment),
    }
  );
  if (!res.ok)
    throw new Error(
      `Unable to generate investment agreement preview for ${investment.investor_email}`
    );

  return res.json();
};

export const resyncWithAirtable = async (
  investment: Investment,
  token: string
) => {
  const res = await fetch(
    `${process.env.INVESTMENT_SERVICE_URL!}/airtable-sync-failed/resync`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-TOKEN": token,
      },
      body: JSON.stringify({ id: investment._id }),
    }
  );
  if (!res.ok) throw new Error("Unable to resync investment");

  return res.json();
};
