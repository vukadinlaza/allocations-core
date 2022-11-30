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
    // completes the task from the request
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

    // enables the next incomplete task
    const secondUpdate = await MigrationTasks.findOneAndUpdate(
      { _id: updated._id, "tasks.complete": false },
      { "tasks.$.disabled": false },
      {
        new: true,
      }
    );

    res.send(secondUpdate);
  } catch (e: any) {
    next(e);
  }
};
