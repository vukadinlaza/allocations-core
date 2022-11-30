import { Router } from "express";
import { createMigration } from "./create-migration";
import { getMigrationByQuery } from "./get-by-query";
import { getMigrationAndTasksById } from "./get-migration-and-tasks-by-id";
import migrationTasksRoutes from "./tasks";
import { updateMigration } from "./update-migration";
import migrationUploadRoutes from "./uploads";

const migrationsRoutes = Router();

migrationsRoutes.post("/", createMigration);
migrationsRoutes.get("/", getMigrationByQuery);
migrationsRoutes.get("/:id", getMigrationAndTasksById);
migrationsRoutes.put("/:id", updateMigration);
migrationsRoutes.use("/uploads", migrationUploadRoutes);
migrationsRoutes.use("/tasks", migrationTasksRoutes);

export default migrationsRoutes;
