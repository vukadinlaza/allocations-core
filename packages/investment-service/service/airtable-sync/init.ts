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
    const investment_input = Investment.hydrate(JSON.parse(Message));

    if (!investment_input.metadata?.get("deal_id")) continue;

    try {
      const { record_id } = await createOrFindDealTrackerInvestment(
        investment_input
      );
      const investment = await Investment.findByIdAndUpdate(
        investment_input._id,
        {
          "metadata.deal_tracker_record_id": record_id,
        },
        { new: true }
      );
      if (!investment) {
        throw new Error(
          `Unable to find investment with id ${investment_input._id}`
        );
      }
      await updateSignedInvestment(investment);
      await triggerTransition({
        id: investment_input._id.toString(),
        action: "COMPLETE",
        phase: "airtable-sync",
      });
    } catch (err: any) {
      console.error("Error syncing investment to deal tracker", err);
      await triggerTransition({
        id: investment_input._id.toString(),
        action: "FAILED",
        phase: "airtable-sync",
      });
    }
  }
};
