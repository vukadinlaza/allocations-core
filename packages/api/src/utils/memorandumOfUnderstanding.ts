import { Document } from "@allocations/core-models";
import {
  createSubmissionAndGeneratePDF,
  getDocspringEnvironment,
} from "./docspring";
import { formatDate } from "./helpers";
import { Organization } from "@allocations/core-models";
import { HttpError } from "@allocations/api-common";
import { Entity } from "@allocations/core-models";

const today = new Date();

const fullAddress = (entity: Entity): string => {
  if (!entity.address_line_1)
    return "8 The Green, Suite A, Dover, Delaware 19901";
  return `${entity.address_line_1}, ${entity.city}, ${entity.state} ${entity.zip_code}`;
};

export const getMemorandumOfUnderstanding = async (
  organization: Organization
) => {
  const document = (await Document.findOne({
    organization_id: organization._id,
  })) as Document;

  if (!document) throw new HttpError("MOU not found", 404);

  return document;
};

export async function createMemorandumOfUnderstanding({
  deal,
  organization,
  user,
  preview = true,
}: {
  deal: any;
  organization: Organization;
  preview: boolean;
  user?: any;
}) {
  const templateId = preview
    ? process.env.MOU_TEMPLATE_PREVIEW_ID!
    : process.env.MOU_TEMPLATE_ID!;

  if (!organization) throw new Error("No organization found.");
  const entity = await Entity.findOne({
    organization_ids: organization._id,
  });

  if (!entity)
    throw new Error(`No entity found for organization id ${organization._id}`);
  const { id, download_url, permanent_download_url } =
    await createSubmissionAndGeneratePDF({
      templateId,
      data: {
        organization_name: organization.name,
        address: fullAddress(entity as unknown as Entity),
        email: user?.email || deal.manager.email,
        date: formatDate(today),
        name:
          deal?.manager_name ||
          deal?.manager?.name ||
          deal?.entity_rep_full_name,
        title:
          deal?.manager_title ||
          deal?.manager?.title ||
          deal?.entity_rep_full_title,
        signature:
          deal?.manager_name ||
          deal?.manager?.name ||
          deal?.entity_rep_full_name,
      },
      metadata: {
        related_entity_type: "organization",
        document_type: "memorandum-of-understanding",
        organization_id: organization._id,
      },
      preview,
      isMOU: true,
    });

  let document: Document | null;
  if (preview) {
    document = await Document.create({
      status: "pending",
      organization_id: organization._id,
      title: `Memorandum Of Understanding/${id}`,
      bucket: process.env.MOU_DOCUMENT_BUCKET,
      path: `organization/memorandum-of-understanding/${getDocspringEnvironment()}/${
        organization._id
      }/${id}`,
      content_type: "application/pdf",
      complete: false,
      type: "fm-document",
      metadata: {
        download_url,
      },
    });
  } else {
    // if the submission is not a preview, update the document's metadata
    document = await Document.findOneAndUpdate(
      { organization_id: organization._id },
      {
        title: `Memorandum Of Understanding/${id}`,
        path: `organization/memorandum-of-understanding/${getDocspringEnvironment()}/${
          organization._id
        }/${id}`,
        "metadata.permanent_download_url": permanent_download_url,
      },
      { new: true }
    );

    if (!document)
      throw new Error(
        `No document found for organization with id ${organization._id}`
      );
  }

  return document;
}
