import { SNSEvent } from "aws-lambda";
import fetch from "node-fetch";

export const handler = async ({ Records }: SNSEvent): Promise<void> => {
  for (const record of Records) {
    try {
      const alarm = JSON.parse(record.Sns.Message);
      const { AlarmName } = alarm;
      await fetch("https://hooks.zapier.com/hooks/catch/10079476/bnfsy63/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ AlarmName }),
      });
    } catch (e: any) {
      console.error(e);
    }
  }
};
