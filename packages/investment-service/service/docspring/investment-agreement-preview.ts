import {
  connectMongoose,
  LambdaEvent,
  parseRequest,
  send,
} from "@allocations/service-common";
import fetch from "node-fetch";
import { getSubmissionPDF } from "../utils/docspring";

export const handler = async (event: LambdaEvent) => {
  await connectMongoose();
  const { body } = parseRequest(event);
  const dealRes = await fetch(
    `${process.env.BUILD_API_URL}/api/v1/deals/${body.metadata.deal_id}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-TOKEN": process.env.ALLOCATIONS_TOKEN!,
      },
    }
  );
  const deal = await dealRes.json();
  // @ts-ignore
  const res = await getSubmissionPDF(
    body,
    deal?.subscription_agreement?.investor_docspring_template_id
  );
  // @ts-ignore
  return send({ link: res.submission.download_url });
};
