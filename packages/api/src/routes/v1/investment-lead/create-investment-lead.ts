import { RequestHandler, Request } from "express";
import { InvestmentLead } from "@allocations/core-models";

type CreateInvestmentLeadBody = {
  readonly amount: number;
  readonly email: string;
  readonly name: string;
  readonly deal_id: string;
};

export const createInvestmentLead: RequestHandler = async (
  req: Request<{}, {}, CreateInvestmentLeadBody, {}, {}>,
  res,
  next
) => {
  res.send(await InvestmentLead.create({ ...req.body, phase: "invited" }));
  try {
  } catch (e) {
    next(e);
  }
};
