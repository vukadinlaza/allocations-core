import { Investment } from "@allocations/core-models";
import { connectMongoose } from "@allocations/service-common";
import { getNameScanData } from "../utils/namescan";
import { updateKYCData } from "../airtable";

export const handler = async ({ Records }: any): Promise<void> => {
  await connectMongoose();
  for (const record of Records) {
    const { _id } = JSON.parse(record.Sns.Message);
    const investment = await Investment.findById(_id);

    try {
      if (!investment) {
        throw new Error(
          `Unable to find investment with id ${_id} while updating KYC Data`
        );
      }
      const nameScanData = (await getNameScanData(investment)) || {};
      await updateKYCData(investment, nameScanData);
    } catch (err) {
      console.error("Error syncing KYC data to airtable", err);
    }
  }
};
