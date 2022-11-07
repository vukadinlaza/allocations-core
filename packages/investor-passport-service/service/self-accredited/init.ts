import type { SQSEvent } from "aws-lambda";
import { InvestorPassport, TaxInformation } from "@allocations/core-models";
import { createATLPEntitiesRow, findRowInLPEntities } from "../airtable";
import { connectMongoose } from "@allocations/service-common";

export const handler = async ({ Records }: SQSEvent): Promise<void> => {
  await connectMongoose();

  for (const record of Records) {
    try {
      const { Message } = JSON.parse(record.body);
      const passport = InvestorPassport.hydrate(JSON.parse(Message));

      const taxInformation = await TaxInformation.findOne({
        passport_id: passport._id,
      });

      if (taxInformation) {
        const existingRecord = await findRowInLPEntities(taxInformation._id);
        if (existingRecord) return;
      }
      await createATLPEntitiesRow(passport, taxInformation as any);
    } catch (e) {
      console.error(e);
    }
  }
};
