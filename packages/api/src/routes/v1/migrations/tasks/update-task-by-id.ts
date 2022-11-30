import { HttpError } from "@allocations/api-common";
import { MigrationTasks } from "@allocations/core-models";
import { Request, RequestHandler } from "express";

type UpdateMigrationTaskBody = {
  readonly complete: boolean;
};

export const updateTaskById: RequestHandler = async (
  req: Request<{}, {}, UpdateMigrationTaskBody, {}, {}>,
  res,
  next
) => {
  try {
    const updated = await MigrationTasks.findOneAndUpdate(
      { "tasks._id": (req.params as { id: string }).id },
      { "tasks.$.complete": req.body.complete },
      { new: true }
    );

    if (!updated)
      throw new HttpError(
        `Unable to find task with id ${(req.params as { id: string }).id}`,
        404
      );

    res.send(updated);
  } catch (e: any) {
    next(e);
  }
};
