// @ts-ignore
import { Investment } from "@allocations/core-models";
// @ts-ignore
import DocSpring from "docspring";
const config = new DocSpring.Configuration();
config.apiTokenId = process.env.DOCSPRING_API_TOKEN_ID;
config.apiTokenSecret = process.env.DOCSPRING_API_TOKEN_SECRET;

let docspring = new DocSpring.Client(config);

export const getSubmissionPDF = async (
  investment: Investment,
  template_id: string
) => {
  // @ts-ignore
  const submission_data = {
    editable: false,
    data: investment,
    test: true,
    wait: true,
  };

  const docspringRes = await new Promise((resolve, reject) => {
    docspring.generatePDF(
      template_id,
      submission_data,
      (error: any, response: unknown) => {
        if (error) reject(error);
        else resolve(response);
      }
    );
  });

  return docspringRes;
};
