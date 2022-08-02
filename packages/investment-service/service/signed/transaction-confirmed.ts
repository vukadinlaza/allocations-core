/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
"use strict";
import { SNSEvent } from "aws-lambda";
import { Investment } from "@allocations/core-models";
import { Transaction } from "@allocations/core-models";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";

export const handler = async ({ Records }: SNSEvent): Promise<void> => {
  try {
    await connectMongoose();
    for (const record of Records) {
      const { _id, wired_date, wired_amount }: Transaction = JSON.parse(
        record.Sns.Message
      );

      const updatedInvestment: Investment | null =
        await Investment.findOneAndUpdate(
          {
            "transactions.treasury_transaction_id": _id,
          },
          {
            "transactions.$.wired_date": wired_date,
            "transactions.$.wired_amount": wired_amount,
          },
          { new: true }
        );

      if (!updatedInvestment) {
        throw new Error(
          `Transaction update failed for treasury_transaction_id ${_id}`
        );
      }

      await triggerTransition({
        id: updatedInvestment._id.toString(),
        action: "DONE",
        phase: "signed",
      });
    }
  } catch (err) {
    console.log(err);
  }
};
