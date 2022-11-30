import { HttpError } from "@allocations/api-common";
import { Migration } from "@allocations/core-models";
import { Request, RequestHandler } from "express";

export const updateMigration: RequestHandler = async (
  req: Request<{}, { id: string }, Migration, {}, {}>,
  res,
  next
) => {
  try {
    const migration = await Migration.findOneAndUpdate(
      { _id: (req.params as { id: string }).id },
      { $set: req.body },
      { new: true }
    );

    if (!migration)
      throw new HttpError(
        `Migration with id ${(req.params as { id: string }).id} not found`,
        404
      );

    res.send({ migration });
  } catch (e) {
    next(e);
  }
};
