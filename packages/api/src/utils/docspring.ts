import { Deal, SubscriptionTemplate } from "@allocations/core-models";
const DocSpring = require("docspring");
import fetch from "node-fetch";
import { FieldPlacement } from "./pagefinder";

const DOCSPRING_API = "https://api.docspring.com";

const TOKEN = Buffer.from(
  `${process.env.DOCSPRING_TOKEN_ID}:${process.env.DOCSPRING_TOKEN_SECRET}`
).toString("base64");

type DataRequestOptions = {
  email: string;
  name: string;
  fields: string[];
  auth_type: string;
};

type DataRequest = DataRequestOptions & {
  id: string;
  state: string;
};

type SubmissionOptions = {
  templateId: string;
  preview?: boolean;
  data: any;
  metadata?: any;
  data_requests?: DataRequestOptions[];
  isMOU?: boolean;
};

type Submission = {
  id: string;
  template_id: string;
  batch_id: string | null;
  state: string;
  test: boolean;
  editable: boolean | null;
  expired: boolean;
  expires_at: string | null;
  password: string | null;
  json_schema_errors: any;
  truncated_text: any;
  metadata: any;
  processed_at: string | null;
  data_requests: DataRequest[];
  pdf_hash: string | null;
  document_url: string;
  download_url: string | null;
  premanent_download_url: string | null;
  actions: string[];
};

type SubmissionResponse = {
  status: string;
  submission: Submission;
};

type DataRequestToken = {
  id: string;
  secret: string;
  expires_at: string;
  data_request_url: string;
};

type DataRequestResponse = {
  status: string;
  token: DataRequestToken;
};

type DataRequestDocument = {
  id: string;
  token_id: string;
  token_secret: string;
  data_request_url: string;
};

export const getDocspringEnvironment = () => {
  return process.env.DOCSPRING_ENVIRONMENT! !== "production"
    ? "dev"
    : "production";
};

export const createSubmission = async ({
  templateId,
  data = {},
  metadata = {},
  data_requests,
}: SubmissionOptions): Promise<SubmissionResponse> => {
  const res = await fetch(
    `${DOCSPRING_API}/api/v1/templates/${templateId}/submissions`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        test: process.env.DOCSPRING_ENVIRONMENT !== "production",
        data,
        metadata,
        data_requests,
      }),
    }
  );

  if (!res.ok) {
    const error = await res.json();
    throw new Error(`Unable to create submission: ${JSON.stringify(error)}`);
  }

  return res.json();
};

export const getDataRequestToken = async (
  id: string
): Promise<DataRequestDocument> => {
  const res = await fetch(
    `${DOCSPRING_API}/api/v1/data_requests/${id}/tokens`,
    {
      method: "POST",
      headers: {
        Authorization: `BASIC ${TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );
  if (!res.ok) throw new Error("Unable to create data request tokens");

  const { token } = (await res.json()) as DataRequestResponse;

  return {
    id,
    token_id: token.id,
    token_secret: token.secret,
    data_request_url: token.data_request_url,
  };
};

export const getSubmission = async (
  submission_id: string
): Promise<Submission> => {
  const res = await fetch(
    `${DOCSPRING_API}/api/v1/submissions/${submission_id}?include_data=true`,
    {
      headers: {
        Authorization: `BASIC ${TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) throw new Error("Unable to get submission");

  return res.json();
};

export const createSubmissionAndGeneratePDF = ({
  templateId,
  preview,
  data,
  metadata,
  isMOU = false,
}: SubmissionOptions): Promise<any> => {
  const config = new DocSpring.Configuration();

  if (isMOU) {
    config.apiTokenId = preview
      ? process.env.DOCSPRING_PREVIEW_TOKEN_ID
      : process.env.MOU_DOCSPRING_ID;
    config.apiTokenSecret = preview
      ? process.env.DOCSPRING_PREVIEW_TOKEN_SECRET
      : process.env.MOU_DOCSPRING_SECRET;
  } else {
    config.apiTokenId = preview
      ? process.env.DOCSPRING_PREVIEW_TOKEN_ID
      : process.env.DOCSPRING_TOKEN_ID;
    config.apiTokenSecret = preview
      ? process.env.DOCSPRING_PREVIEW_TOKEN_SECRET
      : process.env.DOCSPRING_TOKEN_SECRET;
  }

  const docspring = new DocSpring.Client(config);

  const submission_data = {
    editable: false,
    data: data,
    metadata,
    field_overrides: {},
    test: process.env.NODE_ENV === "production" ? false : true,
    wait: true,
  };

  return new Promise((resolve, reject) => {
    docspring.generatePDF(
      templateId,
      submission_data,
      (error: any, response: any) => {
        if (error) reject(error);
        else resolve(response.submission);
      }
    );
  });
};

export const createSubscriptionAgreementDataRequest = async (deal: Deal) => {
  if (deal.subscription_agreement?.docspring_presign_template_id) {
    const subscriptionTemplate = await SubscriptionTemplate.findById(
      deal.subscription_agreement?.docspring_base_template_id
    ).lean();

    if (!subscriptionTemplate)
      throw new Error(
        `Unable to find template with id ${deal.subscription_agreement?.docspring_base_template_id}`
      );

    const { subscription_agreement } = deal;

    const res = await fetch(
      `${DOCSPRING_API}/api/v1/templates/${subscription_agreement.docspring_presign_template_id}/submissions`,
      {
        method: "POST",
        headers: {
          Authorization: `BASIC ${TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          test: false,
          data: {},
          metadata: {
            related_entity_type: "subscription_agreements",
            document_type: "presigned",
            deal_id: deal._id.toString(),
          },
          data_requests: [
            {
              name: deal.manager.name,
              email: deal.manager.email,
              auth_type: "email_link",
              fields:
                subscriptionTemplate?.docspring?.fm_fields?.map(
                  (f) => f.name
                ) || null,
              auth_session_started_at: "",
              auth_provider: "",
            },
          ],
        }),
      }
    );

    if (!res.ok) {
      const json = await res.json();
      throw new Error(
        `Unable to get DocSpring Data Request for FM pre-signing: ${json.error}`
      );
    }
    const dataRequest = await res.json();
    const dataRequestId = dataRequest?.submission?.data_requests[0]?.id;
    const submissionId = dataRequest?.submission?.id;

    if (dataRequestId) {
      const updatedDeal = await Deal.findByIdAndUpdate(
        deal._id,
        {
          "subscription_agreement.fm_signing_data_req_id": dataRequestId,
          "metadata.fm_presign_submission_id": submissionId,
        },
        { new: true }
      );

      if (!updatedDeal?.subscription_agreement?.fm_signing_data_req_id)
        throw new Error(`Unable to add FM Data Request to deal id ${deal._id}`);
    }
    return dataRequest;
  }

  return null;
};

export const getTemplateData = async (
  template_id: string
): Promise<Submission> => {
  const res = await fetch(
    `https://api.docspring.com/api/v1/templates/${template_id}`,
    {
      headers: {
        method: "GET",
        Authorization: `BASIC ${TOKEN}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok)
    throw new Error(
      `Unable to get template data for ${template_id}: ${await res.text()}`
    );

  return res.json();
};
export const addTemplateFields = async (
  template_id: string,
  fields: FieldPlacement[]
): Promise<Submission> => {
  const res = await fetch(
    `${DOCSPRING_API}/api/v1/templates/${template_id}/add_fields`,
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

  if (!res.ok) throw new Error(`Unable to add template fields: ${res.text()}`);

  return res.json();
};
