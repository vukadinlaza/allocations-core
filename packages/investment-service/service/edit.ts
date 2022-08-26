import { Investment, InvestmentAgreement } from "@allocations/core-models";
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
    const { body } = parseRequest(event);
    const investment = await Investment.findOne({
      _id: body.id,
      phase: ["signed", "agreements-pending"],
    });

    if (!investment) {
      return sendError({
        status: "404",
        error: new Error(
          "Investment in phase signed or agreements-pending not found"
        ),
      });
    }

    await InvestmentAgreement.updateMany(
      { investment_id: investment._id, status: { $ne: "archived" } },
      { status: "archived" }
    );

    await triggerTransition({
      id: body.id,
      action: "EDIT",
      phase: investment.phase,
    });

    return send({ acknowledged: true });
  } catch (err: any) {
    console.error(err);
    return sendError({ error: err as Error, status: "500" });
  }
};
