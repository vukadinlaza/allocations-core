import { InvestorPassport } from "@allocations/core-models";
import {
  connectMongoose,
  parseRequest,
  send,
  sendError,
  LambdaEvent,
  triggerTransition,
  LambdaResponse,
} from "@allocations/service-common";

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  try {
    await connectMongoose();
    const { params, body } = parseRequest(event);
    const { investor_passport_id } = params;
    const { phase } = body;

    const existingInvestorPassport = await InvestorPassport.findOne({
      _id: investor_passport_id,
    });

    if (!existingInvestorPassport) {
      throw new Error(`No investment found with id: ${investor_passport_id}`);
    }

    await InvestorPassport.findOneAndUpdate(
      {
        _id: existingInvestorPassport._id,
      },
      body
    );

    await triggerTransition({
      id: investor_passport_id.toString(),
      action: "DONE",
      phase: phase,
    });

    return send({
      acknowledged: true,
      _id: investor_passport_id,
    });
  } catch (err) {
    return sendError({ error: err as Error, status: "500" });
  }
};
