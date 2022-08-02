import { Investment } from "@allocations/core-models";
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
    const { investment_id } = params;
    const { phase, total_committed_amount, wired_amount, wired_date } = body;

    const existingInvestment = await Investment.findOne({
      _id: investment_id,
    });

    if (!existingInvestment) {
      throw new Error(`No investment found with id: ${investment_id}`);
    }

    // This logic will need to be replaced once we start handling multiple transactions
    const transaction_id = existingInvestment.transactions.length
      ? existingInvestment.transactions[0]._id
      : null;

    let updatedInvestment;
    if (transaction_id) {
      updatedInvestment = await Investment.findOneAndUpdate(
        {
          _id: existingInvestment._id,
          "transactions._id": transaction_id,
        },
        {
          "transactions.$.committed_amount": total_committed_amount,
          "transactions.$.wired_amount": wired_amount,
          "transactions.$.wired_date": wired_date,
          ...body,
        },
        { new: true }
      );
    } else {
      updatedInvestment = await Investment.findOneAndUpdate(
        {
          _id: existingInvestment._id,
        },
        {
          $addToSet: {
            transactions: [
              {
                committed_amount: total_committed_amount,
                wired_amount: wired_amount,
                wired_date: wired_date,
              },
            ],
          },
          ...body,
        },
        { new: true }
      );
    }

    // Make it prettier
    let action;
    if (updatedInvestment?.phase === "signed" && phase === "wired") {
      action = "DONE";
    } else if (updatedInvestment?.phase === "wired" && phase === "signed") {
      action = "UNDO";
    } else {
      action = "DONE";
    }

    // Sync with airtable

    await triggerTransition({
      id: investment_id.toString(),
      action: action,
      phase: phase,
    });

    return send({
      acknowledged: true,
      _id: investment_id,
    });
  } catch (err) {
    return sendError({ error: err as Error, status: "500" });
  }
};
