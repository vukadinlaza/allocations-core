import { LambdaEvent } from "@allocations/service-common";
type Headers = {
  headers: {
    "X-API-TOKEN": string;
  };
};

const headers = (token: string): Headers => ({
  headers: {
    "X-API-TOKEN": token,
  },
});

export const buildEvent = (
  token: string,
  body: any,
  params = {}
): LambdaEvent => {
  return {
    body: JSON.stringify(body),
    pathParameters: params,
    // body: body? JSON.stringify(body) : {},
    ...headers(token),
  };
};

process.env.AIRTABLE_API_KEY = "Hello!";
process.env.AIRTABLE_DEAL_TRACKER_BASE_ID = "I love you.";
process.env.AIRTABLE_DEAL_TRACKER_TABLE_ID = "Won't you tell me your name?";
