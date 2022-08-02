import { Deal } from "@allocations/core-models";
import { SQSEvent } from "aws-lambda";
import fetch from "node-fetch";

const requestHook = async (deal: Deal, url: string) => {
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
  for (const record of Records) {
    const { Message } = JSON.parse(record.body);

    const deal = JSON.parse(Message) as Deal;
    if (!deal.organization_id) continue;

    await requestHook(deal, process.env.ZAPIER_CREATE_RUN_HOOK!);
  }
};
