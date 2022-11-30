import { MigrationUpload } from "@allocations/core-models";
import { RequestHandler } from "express";

export const deleteByUploadId: RequestHandler = async (req, res, next) => {
  try {
    await MigrationUpload.findByIdAndDelete(req.params.id);
    res.send({ acknowledged: true });
  } catch (e) {
    next(e);
  }
};
