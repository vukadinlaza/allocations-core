import { Router } from "express";
import { getAgreementByQuery } from "./get-agreement-by-query";
import { signDealAgreement } from "./sign-deal-agreement";

const dealAgreementsRoutes = Router();

dealAgreementsRoutes.get("/", getAgreementByQuery);
dealAgreementsRoutes.post("/:id/sign", signDealAgreement);

export default dealAgreementsRoutes;
