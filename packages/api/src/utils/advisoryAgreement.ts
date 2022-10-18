import { Deal, Task, Document } from "@allocations/core-models";
import { Entity } from "@allocations/core-models";
import {
  createSubmissionAndGeneratePDF,
  getDocspringEnvironment,
} from "./docspring";

export const createAdvisoryAgreement = async (
  deal: Deal,
  task: Task,
  preview?: boolean
) => {
  const titleMap = {
    spv: "Manager",
    fund: "General Partner",
    acquisition: "Manager",
    migration: "",
  };

  const entity = await Entity.findById(deal.master_entity_id);

  const { id, permanent_download_url, download_url } =
    await createSubmissionAndGeneratePDF({
      templateId: preview
        ? process.env.ADVISORY_PREVIEW_TEMPLATE_ID!
        : process.env.ADVISORY_TEMPLATE_ID!,
      preview,
      data: {
        private_fund: `${deal.name}, a series of ${
          entity
            ? `${entity?.name} ${entity?.structure}`
            : "Allocations Funds LLC"
        }`,
        effective_date: new Date().toISOString().split("T")[0],
        name: deal.manager.name,
        title: titleMap[deal.type],
        signature: deal.manager.name,
      },
      metadata: {
        related_entity_type: "deal",
        document_type: "investment-advisory-agreement",
        deal_id: deal._id,
      },
    });
  if (!preview) {
    await Document.create({
      status: "pending",
      deal_id: deal._id,
      task_id: task._id,
      title: "Investment Advisory Agreement",
      bucket: process.env.DOCUMENTS_BUCKET,
      path: `deal/investment-advisory-agreement/${getDocspringEnvironment()}/${
        deal._id
      }/${id}`,
      content_type: "application/pdf",
      complete: false,
      type: "fm-document",
      metadata: {
        permanent_download_url,
      },
    });
  }
  return {
    download_url,
    task,
  };
};
