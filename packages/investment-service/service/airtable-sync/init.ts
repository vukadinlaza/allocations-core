import { Investment } from "@allocations/core-models";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import {
  updateSignedInvestment,
  createOrFindDealTrackerInvestment,
} from "../airtable";

export const handler = async ({ Records }: any): Promise<void> => {
  await connectMongoose();
  for (const record of Records) {
    const { Message } = JSON.parse(record.body);
    const investmentInput = Investment.hydrate(JSON.parse(Message));

    try {
      if (process.env.SKIP_AIRTABLE_SYNC || investmentInput.test) {
        return await triggerTransition({
          id: investmentInput._id.toString(),
          action: "COMPLETE",
          phase: "airtable-sync",
        });
      }

      const { record_id } = await createOrFindDealTrackerInvestment(
        investmentInput
      );
      const investment = await Investment.findByIdAndUpdate(
        investmentInput._id,
        {
          "metadata.deal_tracker_record_id": record_id,
        },
        { new: true }
      );
      if (!investment) {
        throw new Error(
          `Unable to find investment with id ${investmentInput._id}`
        );
      }
      await updateSignedInvestment(investment);
      await triggerTransition({
        id: investmentInput._id.toString(),
        action: "COMPLETE",
        phase: "airtable-sync",
      });
    } catch (err: any) {
      console.error("Error syncing investment to deal tracker", err);
      await triggerTransition({
        id: investmentInput._id.toString(),
        action: "FAILED",
        phase: "airtable-sync",
      });
    }
  }
};
