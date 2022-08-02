import fetch from "node-fetch";

type Record = {
  id: string;
  createdTime: string;
  fields: any;
};

export default async function (user_id: string) {
  const response = await fetch(
    `https://api.airtable.com/v0/${process.env
      .AIRTABLE_BASE!}/Banking%20Information?filterByFormula=({User Id}="${user_id}")`,
    {
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`, // API key
        "Content-Type": "application/json", // we will receive a json object
      },
    }
  );
  const resData = (await response.json()) as any;
  if (!resData.records) return false;

  const fields = resData.records.map((rec: Record) => rec.fields);
  return fields.length > 0;
}
