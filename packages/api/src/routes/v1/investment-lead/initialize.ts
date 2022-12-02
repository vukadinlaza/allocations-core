import { HttpError } from "@allocations/api-common";
import { InvestmentLead } from "@allocations/core-models";
import { Request, RequestHandler } from "express";

type InitializeBody = {
  readonly passport_id: string;
  readonly user_id: string;
  readonly deal_id: string;
  readonly total_committed_amount: number;
};

export const initialize: RequestHandler = async (
  req: Request<{ [key: string]: string }, {}, InitializeBody, {}, {}>,
  res,
  next
) => {
  const lead = await InvestmentLead.findById(req.params.id);

  if (!lead)
    throw new HttpError(`Lead with id ${req.params.id} not found`, 404);

  const investment = await InvestmentLead.initialize(req.params.id, {
    ...req.body,
    phase: "signed",
  });

  if (!investment) throw new HttpError("Investment not created", 500);

  res.send(investment);
  try {
  } catch (e) {
    next(e);
  }
};
