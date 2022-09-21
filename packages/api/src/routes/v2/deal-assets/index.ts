import { Router } from "express";
import { create } from "./create";
import { getDealAssetsByQuery } from "./get-by-query";
import { uploadById } from "./upload-by-id";

const dealAssetsRoutes = Router();

dealAssetsRoutes.post("/", create);
dealAssetsRoutes.get("/", getDealAssetsByQuery);
dealAssetsRoutes.get("/:id/upload", uploadById);

export default dealAssetsRoutes;
