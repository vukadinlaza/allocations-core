import { Investment } from "@allocations/core-models";
import { connectMongoose } from "@allocations/service-common";
import { updateAirtableBSF, getNewBSFees } from "../utils/blueSkyFees";

export const handler = async ({ Records }: any): Promise<void> => {
  await connectMongoose();
  for (const record of Records) {
    const { _id, metadata } = JSON.parse(record.Sns.Message);
    const investment = await Investment.findById(_id);

    try {
      if (!investment) {
        throw new Error(`Unable to find investment with id ${_id}`);
      }
      const investmentsWithBSF = await getNewBSFees(metadata.deal_id);
      await updateAirtableBSF(investmentsWithBSF, metadata.deal_id);
    } catch (err) {
      console.error("Error syncing blue sky fees to deal tracker", err);
    }
  }
};
