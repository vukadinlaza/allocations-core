import { Router } from "express";
import { createUpload } from "./create-upload";
import { deleteByUploadId } from "./delete-by-upload-id";
import { getUploadsByMigrationId } from "./get-uploads-by-migration-id";
import { updateUploadById } from "./update-upload-by-id";

const migrationUploadRoutes = Router();

migrationUploadRoutes.post("/", createUpload);
migrationUploadRoutes.get("/:id", getUploadsByMigrationId);
migrationUploadRoutes.delete("/:id", deleteByUploadId);
migrationUploadRoutes.put("/:id", updateUploadById);

export default migrationUploadRoutes;
