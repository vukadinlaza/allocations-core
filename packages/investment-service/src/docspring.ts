import {
  Deal,
  Investment,
  InvestorFormField,
  SubscriptionTemplate,
} from "@allocations/core-models";
import fetch from "node-fetch";

const TOKEN = Buffer.from(process.env.DOCSPRING_TOKEN!).toString("base64");

const createSubmission = async ({
  templateId,
  data,
  metadata,
}: {
  templateId: string;
  data: any;
  metadata: any;
}) => {
  const res = await fetch(
    `https://api.docspring.com/api/v1/templates/${templateId}/submissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        data,
        metadata: { ...metadata, model: "investments" },
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to make docspring submission: ${await res.text()}`);
  }

  return res.json();
};

export const createSubscriptionAgreement = (
  investment: Investment & { deal: Deal },
  subscriptionTemplate: SubscriptionTemplate
) => {
  const formFields = subscriptionTemplate.form_structure.groups.reduce<
    InvestorFormField[]
  >((acc, group) => [...acc, ...group.fields], []);

  const data: { [key: string]: any } = {};
  for (const field of subscriptionTemplate.docspring.investor_fields) {
    if (field.value_setter) {
      const fieldSetter = new Function(
        ...field.value_setter.parameters,
        field.value_setter.body
      );
      data[field.name] = fieldSetter(
        investment,
        subscriptionTemplate.docspring.investor_fields,
        formFields
      );
    } else {
      // @ts-ignore
      data[field.name] = investment[field.name] || "";
    }
  }

  return createSubmission({
    templateId:
      investment.deal.subscription_agreement.investor_docspring_template_id,
    data,
    metadata: {
      modelId: `${investment._id.toString()}`,
      assetType: "subscription-agreement",
      title: `subscription-agreement.pdf`,
    },
  });
};
