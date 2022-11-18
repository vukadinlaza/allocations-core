import { Router } from "express";
import { update } from "./update";

const dealPhaseRoutes = Router();

dealPhaseRoutes.put("/:id", update);

export default dealPhaseRoutes;
