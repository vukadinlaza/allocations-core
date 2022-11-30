import { Router } from "express";
import { updateTaskById } from "./update-task-by-id";

const migrationTasksRoutes = Router();

migrationTasksRoutes.put("/:id", updateTaskById);

export default migrationTasksRoutes;
