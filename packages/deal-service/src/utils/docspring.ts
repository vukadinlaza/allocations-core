import { Deal, Document, SubscriptionTemplate } from "@allocations/core-models";
import fetch from "node-fetch";
import { S3 } from "aws-sdk";
import FormData from "form-data";
import { getFieldPlacement } from "../../service/pagefinder";

const DOCSPRING_API = "https://api.docspring.com";

const TOKEN = Buffer.from(
  `${process.env.DOCSPRING_TOKEN_ID}:${process.env.DOCSPRING_TOKEN_SECRET}`
).toString("base64");

// might use something else
export type Template = {
  id: string;
  document_url: string;
};

export const createInvestorTemplate = async (
  subscriptionTemplate: SubscriptionTemplate,
  deal: Deal,
  document: Document
): Promise<{ acknowledged: boolean }> => {
  try {
    const s3 = new S3();
    const pdf = await s3
      .getObject({
        Bucket: document.bucket,
        Key: document.path,
      })
      .promise();
    const fd = new FormData();
    fd.append("template[document]", pdf.Body, {
      filename: `${deal.portfolio_company_name}-Investor-Subscription-Agreement-${deal._id}.pdf`,
    });
    fd.append(
      "template[name]",
      `${deal.portfolio_company_name} - Investor Subscription Agreement - ${deal._id}.pdf`
    );
    fd.append("template[allow_additional_properties]", "true");
    fd.append(
      "parent_folder_id",
      process.env.DOCSPRING_INV_SUB_AGREEMENT_FOLDER_ID!
    );

    const templateRes = await fetch(`${DOCSPRING_API}/api/v1/templates`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${TOKEN}`,
      },
      body: fd,
    });

    if (!templateRes.ok) {
      throw new Error(
        `Unable to create investor template for ${
          document._id
        } ${await templateRes.text()}`
      );
    }
    const template = (await templateRes.json()) as Template;

    const checkDocStatus = async () => {
      await new Promise((resolve) => {
        setTimeout(resolve, 60000);
      });

      const getTemplateRes = await fetch(
        `${DOCSPRING_API}/api/v1/templates/${template.id}`,
        {
          method: "GET",
          headers: {
            Authorization: `Basic ${TOKEN}`,
          },
        }
      );

      const templateJson = await getTemplateRes.json();

      if (templateJson?.document_state === "processed") {
        await new Promise((resolve) => {
          setTimeout(resolve, 30000);
        });
        return;
      } else {
        await checkDocStatus();
      }
    };

    await checkDocStatus();

    const docspringFields =
      // @ts-ignore
      subscriptionTemplate?.docspring?.investor_fields || [];

    const templateData = await fetch(
      `${DOCSPRING_API}/api/v1/templates/${template.id}`,
      {
        method: "GET",
        headers: {
          Authorization: `Basic ${TOKEN}`,
        },
      }
    );
    if (!templateData.ok)
      throw new Error(`Error getting templateData: ${templateData.text()}`);

    const templateDataRes = await templateData.json();

    const fields = await getFieldPlacement(
      templateDataRes.document_url,
      docspringFields,
      deal.subscription_agreement.field_injection_strategy
    );

    const addFieldsRes = await fetch(
      `${DOCSPRING_API}/api/v1/templates/${template.id}/add_fields`,
      {
        method: "PUT",
        headers: {
          Authorization: `Basic ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fields: fields,
        }),
      }
    );

    const { new_field_ids } = await addFieldsRes.json();
    if (!new_field_ids.length)
      throw new Error(`Unable to add fields for ${document._id}`);

    await Deal.findByIdAndUpdate(
      deal._id,
      {
        "subscription_agreement.investor_docspring_template_id": template.id,
      },
      { new: true }
    );

    return { acknowledged: true };
  } catch (e: any) {
    throw new Error(e.message);
  }
};

export const putTemplate = async (token: string, id: string, body: any) => {
  const allowres = await fetch(`${DOCSPRING_API}/api/v1/templates/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Basic ${token}`,
    },
    body: JSON.stringify({
      template: {
        ...body,
      },
    }),
  });

  if (!allowres.ok)
    throw new Error(`Error getting templateData: ${allowres.text()}`);

  return allowres.json();
};
