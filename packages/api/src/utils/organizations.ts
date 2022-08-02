const { Document } = require("@allocations/core-models");

export const checkOrgforSignedMoU = async (id: string) => {
  const document = await Document.findOne({ organization_id: id });

  if (document?.complete) {
    return false;
  }

  return document;
};
