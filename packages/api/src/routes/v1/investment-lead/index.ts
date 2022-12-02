import { Router } from "express";
import { createInvestmentLead } from "./create-investment-lead";
import { initialize } from "./initialize";

export const investmentLeadRoutes = Router();

investmentLeadRoutes.post("/", createInvestmentLead);
investmentLeadRoutes.post("/initialize/:id", initialize);
