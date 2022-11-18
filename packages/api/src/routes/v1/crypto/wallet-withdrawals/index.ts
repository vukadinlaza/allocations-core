import { Router } from "express";
import { createWalletWithdrawal } from "./create-withdrawal";

export const walletWithdrawalRoutes = Router();

walletWithdrawalRoutes.post("/", createWalletWithdrawal);
