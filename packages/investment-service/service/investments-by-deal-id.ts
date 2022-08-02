import { Investment } from "@allocations/core-models";
import { Types } from "mongoose";
import {
  connectMongoose,
  parseRequest,
  send,
  sendError,
  LambdaEvent,
  LambdaResponse,
} from "@allocations/service-common";

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  try {
    await connectMongoose();
    const { params } = parseRequest(event);
    const { deal_id } = params;

    if (!deal_id || !Types.ObjectId.isValid(deal_id)) {
      return sendError({
        error: new Error(`invalid or missing deal_id: ${deal_id}`),
        status: "400",
      });
    }

    const investmentsByDealId = await Investment.find({
      "metadata.deal_id": deal_id,
    });
    return send({ investments: investmentsByDealId });
  } catch (err: any) {
    console.error(err);
    return sendError({ error: err as Error, status: "500" });
  }
};
