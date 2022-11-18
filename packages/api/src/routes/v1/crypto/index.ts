import { Router } from "express";
import { cryptoOptionsRoutes } from "./crypto-options";
import { cryptoTransactionsRoutes } from "./crypto-transactions";
import { walletWithdrawalRoutes } from "./wallet-withdrawals";
import { coinbaseWebhookRoutes } from "./webhooks";

export const cryptoRoutes = Router();

cryptoRoutes.use("/options", cryptoOptionsRoutes);
cryptoRoutes.use("/transactions", cryptoTransactionsRoutes);
cryptoRoutes.use("/wallet-withdrawals", walletWithdrawalRoutes);
cryptoRoutes.use("/webhooks", coinbaseWebhookRoutes);
