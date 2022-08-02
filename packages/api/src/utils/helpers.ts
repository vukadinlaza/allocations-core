import { InvestmentDocument } from "@allocations/core-models";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const getTask = (phases: any, phaseName: string, taskName: string) => {
  const phase = phases.find((p: any) => p.name === phaseName);
  // eslint-disable-next-line no-unsafe-optional-chaining
  const task = phase?.tasks.find((t: any) => t.title === taskName);
  if (!task) throw Error(`No task ${taskName} in phase ${phaseName}`);
  return task;
};

export const formatDate = (date: Date) => {
  const monthIndex = date.getUTCMonth();
  const month = monthIndex + 1;
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();
  return `${month}-${day}-${year}`;
};

export const getFromBuild = (token: string, api: string) => {
  return fetch(`${process.env.BUILD_API_URL!}${api}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-API-TOKEN": token,
    },
  });
};

export const addLinkToDocuments = async (
  documents: InvestmentDocument[],
  client: any
) => {
  const updatedDocuments = await Promise.all(
    documents.map(async (document: InvestmentDocument) => {
      if (!document.bucket || !document.path) return undefined;
      const command = new GetObjectCommand({
        Bucket: document.bucket,
        Key: document.path,
      });
      return {
        ...document,
        link: await getSignedUrl(client as any, command as any),
      };
    })
  );
  return updatedDocuments;
};
