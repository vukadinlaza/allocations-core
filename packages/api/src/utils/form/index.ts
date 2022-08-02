import { Deal } from "@allocations/core-models";
import json from "../../../subscriptionAgreement/basicTemplate.json";
export const getDealFormSchema = async () => {
  // export const getDealFormSchema = async (deal_id: string) => {
  // const deal = (await fetch(
  //   `${process.env.BUILD_API_URL}/api/v1/deals/${deal_id}`
  // )) as unknown as Deal;

  // deal.docspring_template_id;

  // const response = await fetch(
  //   `${process.env.SIGNATURE_API_URL}/api/v1/json/${deal.docspring_template_id}`
  // );

  // return response.json();
  return json;
};

export const postFormData = async (
  deal_id: string,
  data: { [key: string]: boolean | string }
) => {
  const deal = (await fetch(
    `${process.env.BUILD_API_URL}/api/v1/deals/${deal_id}`
  )) as unknown as Deal;

  const response = await fetch(
    `${process.env.SIGNATURE_API_URL}/api/v1/signatures`,
    {
      method: "POST",
      body: JSON.stringify({
        ...data,
        template_id: deal.docspring_template_id,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.json();
};
