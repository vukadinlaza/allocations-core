import { Investment } from "@allocations/core-models";
import {
  triggerTransition,
  connectMongoose,
  LambdaEvent,
  parseRequest,
} from "@allocations/service-common";

export const handler = async (event: LambdaEvent) => {
  await connectMongoose();
  const { params, body } = parseRequest(event);
  const { investment_id } = params;

  const investment = await Investment.findByIdAndUpdate(
    investment_id,
    {
      investor_name: body.investor_name,
      total_committed_amount: body.total_committed_amount,
      transactions: body.transactions,
      investor_type: body.investor_type,
      investor_entity_name: body.investor_entity_name,
      investor_country: body.investor_country,
      investor_state: body.investor_state,
      accredited_investor_type: body.accredited_investor_type,
      carry_fee_percent: body.carry_fee_percent,
      management_fee_percent: body.management_fee_percent,
      metadata: body.metadata,
    },
    { new: true }
  );

  await triggerTransition({
    id: investment!._id.toString(),
    action: "DONE",
    phase: "invited",
  });
};
