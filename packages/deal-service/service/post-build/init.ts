import { Deal, Entity, Organization } from "@allocations/core-models";
import { SQSEvent } from "aws-lambda";
import fetch from "node-fetch";
import { Types } from "mongoose";
import { connectMongoose } from "@allocations/service-common";

type MungedDeal = Deal & {
  entity: string;
  client_type:
    | "New - HVP"
    | "New - Non-HVP"
    | "Existing - HVP"
    | "Existing - Non-HVP";
};

const clientTypeMap: {
  [key: string]: {
    [key: string]:
      | "New - HVP"
      | "New - Non-HVP"
      | "Existing - HVP"
      | "Existing - Non-HVP";
  };
} = {
  new: {
    hvp: "New - HVP",
    nonHvp: "New - Non-HVP",
  },
  existing: {
    hvp: "Existing - HVP",
    nonHvp: "Existing - Non-HVP",
  },
};

const requestHook = async (deal: MungedDeal, url: string) => {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(deal),
  });

  if (!res.ok)
    throw new Error(
      `Unable to create process.st run ${url} for deal (${deal._id})`
    );

  return res.json();
};

export const handler = async ({ Records }: SQSEvent): Promise<void> => {
  await connectMongoose();
  try {
    for (const record of Records) {
      const { Message } = JSON.parse(record.body);

      const deal = JSON.parse(Message) as Deal;
      if (!deal.organization_id) continue;

      const entity = await Entity.findById(deal.master_entity_id);
      const organization = await Organization.findById(deal.organization_id);
      const orgDeals = await Deal.find({
        organization_id: new Types.ObjectId(deal.organization_id),
      });

      const clientIdentifier = orgDeals?.length > 1 ? "existing" : "new";
      const isHVP = organization?.high_volume_partner ? "hvp" : "nonHvp";

      const mungedDeal = deal as MungedDeal;

      mungedDeal.entity = entity?.name || "Atomizer LLC";
      mungedDeal.client_type = clientTypeMap[clientIdentifier][isHVP];

      await requestHook(mungedDeal, process.env.ZAPIER_CREATE_RUN_HOOK!);
    }
  } catch (err: any) {
    console.error(err);
  }
};
