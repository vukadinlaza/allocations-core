import { Router } from "express";
import { createCryptoTransaction } from "./create-transaction";
import { getCryptoTransactionById } from "./get-transaction-by-id";
import { getCryptoTransactionsByQuery } from "./get-transactions-by-query";

export const cryptoTransactionsRoutes = Router();

cryptoTransactionsRoutes.post("/", createCryptoTransaction);
cryptoTransactionsRoutes.get("/:id", getCryptoTransactionById);
cryptoTransactionsRoutes.get("/", getCryptoTransactionsByQuery);
