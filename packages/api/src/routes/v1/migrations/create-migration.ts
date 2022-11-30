import { Migration, MigrationTasks } from "@allocations/core-models";
import { Request, RequestHandler } from "express";

type CreateMigrationBody = {
  readonly user_id: string;
  readonly migration_from: string;
  readonly requested_completion_date: Date;
  readonly number_of_deals: number;
  readonly start_date: Date;
};

export const createMigration: RequestHandler = async (
  req: Request<{}, {}, CreateMigrationBody, {}, {}>,
  res,
  next
) => {
  try {
    const migration = await Migration.create(req.body);
    const tasks = await MigrationTasks.createWithTasks(migration._id);
    res.send({ migration, tasks });
  } catch (e) {
    next(e);
  }
};
