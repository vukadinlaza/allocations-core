import { Router } from "express";
import { createMigration } from "./create-migration";
import { getMigrationByQuery } from "./get-by-query";
import { getMigrationAndTasksById } from "./get-migration-and-tasks-by-id";
import { updateMigration } from "./update-migration";
import migrationUploadRoutes from "./uploads";

const migrationsRoutes = Router();

migrationsRoutes.post("/", createMigration);
migrationsRoutes.get("/", getMigrationByQuery);
migrationsRoutes.get("/:id", getMigrationAndTasksById);
migrationsRoutes.put("/:id", updateMigration);
migrationsRoutes.use("/uploads", migrationUploadRoutes);

export default migrationsRoutes;
