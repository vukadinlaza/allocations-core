import { HttpError } from "@allocations/api-common";
import { MigrationUpload } from "@allocations/core-models";
import { RequestHandler } from "express";

export const updateUploadById: RequestHandler = async (req, res, next) => {
  try {
    const updatedDoc = await MigrationUpload.findOneAndUpdate(
      { _id: req.params.id },
      req.body,
      { new: true }
    );

    if (!updatedDoc)
      throw new HttpError(`Document with id ${req.params.id} not found`, 404);

    res.send(updatedDoc);
  } catch (e) {
    next(e);
  }
};
