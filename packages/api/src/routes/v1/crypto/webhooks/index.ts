import { Router } from "express";
import { updateCryptoTransaction } from "./update-transaction-webhook";
import { updateWalletWithdrawal } from "./update-withdrawal-webhook";

export const coinbaseWebhookRoutes = Router();

coinbaseWebhookRoutes.post("/transactions", updateCryptoTransaction);
coinbaseWebhookRoutes.post("/withdrawals", updateWalletWithdrawal);
