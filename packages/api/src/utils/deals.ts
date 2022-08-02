/* eslint-disable @typescript-eslint/no-non-null-assertion */
import fetch from "node-fetch";

export const userAcknowledgedComplete = async (id: string, token: string) => {
  const res = await fetch(
    `${process.env.DEAL_SERVICE_URL!}/user-acknowledged-complete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-TOKEN": token,
      },
      body: JSON.stringify({ id }),
    }
  );

  if (!res.ok) throw new Error(`Unable to post to lambda.`);

  return res.json();
};

export const inviteInvestorsTaskComplete = async (
  id: string,
  token: string
) => {
  const res = await fetch(
    `${process.env.DEAL_SERVICE_URL!}/invite-investors-task-complete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-TOKEN": token,
      },
      body: JSON.stringify({ id }),
    }
  );

  if (!res.ok) throw new Error("Unable to post to lambda");

  return res.json();
};

export const signInvestmentAgreement = async (id: string, token: string) => {
  const res = await fetch(
    `${process.env.DEAL_SERVICE_URL!}/sign-investment-agreement`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-TOKEN": token,
      },
      body: JSON.stringify({ id }),
    }
  );
  if (!res.ok) throw new Error(`Unable to post to lambda.`);

  return res.json();
};
