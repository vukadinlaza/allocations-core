import { createInvestment } from "../airtable";
import { SQSEvent } from "aws-lambda";
import { Investment } from "@allocations/core-models";

export const handler = async ({ Records }: SQSEvent): Promise<void> => {
  for (const record of Records) {
    const { Message } = JSON.parse(record.body);
    const investment: Investment = JSON.parse(Message);
    try {
      await createInvestment(investment);
    } catch (err: any) {
      console.error(
        "Problem adding invited investment to Deal tracker: " + err.message
      );
    }
  }
};
