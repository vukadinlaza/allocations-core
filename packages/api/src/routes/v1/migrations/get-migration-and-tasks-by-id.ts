import { Migration, MigrationTasks } from "@allocations/core-models";
import { RequestHandler } from "express";

export const getMigrationAndTasksById: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const [migration, tasks] = await Promise.all([
      Migration.findById(req.params.id),
      MigrationTasks.findOne({ migration_id: req.params.id }),
    ]);
    res.send({ migration, tasks });
  } catch (e) {
    next(e);
  }
};
