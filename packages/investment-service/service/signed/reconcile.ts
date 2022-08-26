import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import { Investment } from "@allocations/core-models";
import { SNSEvent } from "aws-lambda";

const TYPE_MAP: Record<string, string> = {
  ach: "RECONCILE_ACH",
  wire: "RECONCILE_WIRE",
};

export const handler = async ({ Records }: SNSEvent): Promise<void> => {
  await connectMongoose();

  for (const record of Records) {
    const { investment_id, type } = JSON.parse(record.Sns.Message);

    try {
      const investment = await Investment.findById(investment_id);
      if (!investment) continue;

      const action = TYPE_MAP[type];
      if (!action) throw Error(`Invalid reconciliation type ${type}`);

      return triggerTransition({
        id: investment._id.toString(),
        action,
        phase: "signed",
      });
    } catch (e: any) {
      console.error(e);
    }
  }
};
