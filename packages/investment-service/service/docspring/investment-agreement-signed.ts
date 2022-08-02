import { Investment } from "@allocations/core-models";
import { connectMongoose } from "@allocations/service-common";
import { SNSEvent } from "aws-lambda";
import fetch from "node-fetch";
import https from "https";
import FormData from "form-data";
import { getSubmissionPDF } from "../utils/docspring";

export const handler = async ({ Records }: SNSEvent) => {
  await connectMongoose();
  for (const record of Records) {
    const { _id, metadata }: Investment = JSON.parse(record.Sns.Message);
    const investment = await Investment.findById(_id);
    //@ts-ignore
    const deal_id = metadata.deal_id;
    const dealRes = await fetch(
      `${process.env.BUILD_API_URL}/api/v1/deals/${deal_id}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-TOKEN": process.env.ALLOCATIONS_TOKEN!,
        },
      }
    );
    const deal = await dealRes.json();
    try {
      if (!investment) {
        throw new Error(`Unable to find investment with id ${_id}`);
      }
      //@ts-ignore
      const { submission } = await getSubmissionPDF(
        investment,
        deal.docspring_template_id
      );
      const form = new FormData();
      await new Promise((resolve, reject) => {
        https
          .get(submission.download_url, async (stream) => {
            form.append("file", stream, "InvestmentAgreement.pdf");
            const res = await fetch(
              `${
                process.env.INVESTMENT_API_URL
              }/api/v1/documents/${investment._id.toString()}`,
              {
                method: "POST",
                headers: {
                  "X-API-TOKEN": process.env.ALLOCATIONS_TOKEN!,
                },
                body: form,
              }
            );
            const json = await res.json();
            resolve(json);
          })
          .on("error", (err) => {
            reject(err);
          });
      });

      await Investment.findByIdAndUpdate(_id, {
        "documents.investment_agreement": submission.download_url,
      });
    } catch (err) {
      console.error("Error creating signed investment document", err);
    }
  }
};
