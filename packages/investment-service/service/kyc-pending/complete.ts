import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import { Investment } from "@allocations/core-models";
import { SNSEvent } from "aws-lambda";

export const handler = async ({ Records }: SNSEvent): Promise<void> => {
  await connectMongoose();

  for (const record of Records) {
    const { id: passportId } = JSON.parse(record.Sns.Message);

    try {
      const investments = await Investment.find({
        passport_id: passportId,
        phase: "kyc-pending",
      });

      await Promise.all(
        investments.map((investment) => {
          return triggerTransition({
            id: investment._id.toString(),
            action: "PASSED",
            phase: "kyc-pending",
          });
        })
      );
    } catch (e: any) {
      console.error(e);
    }
  }
};
