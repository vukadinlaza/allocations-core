import { Router } from "express";
import { getCryptoOptionByDealId } from "./get-crypto-option-by-deal-id";
import { createCryptoOption } from "./create-crypto-option";

export const cryptoOptionsRoutes = Router();

cryptoOptionsRoutes.post("/", createCryptoOption);
cryptoOptionsRoutes.get("/:deal_id", getCryptoOptionByDealId);
