import { Migration, MigrationTasks } from "@allocations/core-models";
import { RequestHandler } from "express";

export const getMigrationByQuery: RequestHandler = async (req, res, next) => {
  try {
    const migrations = await Migration.find(req.query);
    const migrationsAndTasks = await Promise.all(
      migrations.map(async (migration) => ({
        migration,
        tasks: await MigrationTasks.findOne({ migration_id: migration._id }),
      }))
    );

    res.send(migrationsAndTasks);
  } catch (e) {
    next(e);
  }
};
