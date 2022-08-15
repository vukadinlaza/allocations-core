import type { SQSEvent } from "aws-lambda";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import {
  Entity,
  EntityAgreement,
  InvestorPassport,
} from "@allocations/core-models";
import { createMasterSeriesAgreement } from "../../utils/docspring";

export const handler = async ({ Records }: SQSEvent) => {
  try {
    await connectMongoose();

    for (const record of Records) {
      const { Message } = JSON.parse(record.body);
      const { _id } = JSON.parse(Message);
      const entity = (await Entity.findById(_id)
        .populate<{ manager: InvestorPassport }>("manager")
        .populate<{ member: InvestorPassport }>("member")) as Entity & {
        manager: InvestorPassport;
        member: InvestorPassport;
      };
      if (!entity) continue;

      const agreement = await EntityAgreement.findOne({
        entity_id: entity._id,
        type: "master-series-llc-agreement",
      });

      let waitingForGeneration = false;
      if (!agreement) {
        waitingForGeneration = true;
        await createMasterSeriesAgreement(entity);
      }

      if (waitingForGeneration) continue;

      await triggerTransition({
        id: entity._id.toString(),
        action: "GENERATION_COMPLETE",
        phase: "generate-agreements",
      });
    }
  } catch (err: any) {
    console.error(err);
  }
};
