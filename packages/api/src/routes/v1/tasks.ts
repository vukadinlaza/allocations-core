import { Router } from "express";
import fetch from "node-fetch";
import { basename } from "path";
import { Deal, DealPhase } from "@allocations/core-models";
import { HttpError, logger } from "@allocations/api-common";
const fileName = basename(__filename, ".ts");
const log = logger.child({ module: fileName });

const requestHook = async (url: string, body: any) => {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Unable to update process st run`);

  return res.json();
};

export default Router().post("/bank-info/:task_id", async (req, res, next) => {
  try {
    const {
      address_line_1,
      address_line_2,
      city,
      state,
      country,
      zip_code,
      ssn_1,
      ssn_2,
      ssn_3,
    } = req.body;
    const phase = await DealPhase.findOne({
      "tasks._id": req.params.task_id,
    });
    if (!phase) throw new HttpError("Phase not found");

    const deal = await Deal.findById(phase.deal_id).lean();

    if (!deal) throw new HttpError("Deal not found");

    const run_name = `${deal.organization_name} ${deal.portfolio_company_name} ${deal._id}`;

    const formatted_address = `${address_line_1} ${address_line_2} ${city} ${state} ${country} ${zip_code}`;

    const formatted_ssn = `${ssn_1}-${ssn_2}-${ssn_3}`;

    const zapierBody = {
      ...req.body,
      ...deal,
      run_name,
      formatted_address,
      formatted_ssn,
      node_env: process.env.NODE_ENV!,
    };

    await requestHook(process.env.ZAPIER_BANK_INFO_TASK_URL!, zapierBody);

    await DealPhase.findOneAndUpdate(
      { "tasks._id": req.params.task_id },
      { "tasks.$.complete": true }
    );

    res.send(phase?.deal_id || null);
  } catch (e: any) {
    log.error({ err: e }, e.message);
    next(e);
  }
});
