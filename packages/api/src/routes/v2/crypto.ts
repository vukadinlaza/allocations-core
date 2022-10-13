import { CryptoTransaction } from "@allocations/core-models";
import { Router } from "express";
import { initializeCryptoTransaction } from "../../services/crypto";

export default Router().post("/create-transaction", async (req, res, next) => {
  try {
    const {
      deal_name,
      deal_id,
      investor_name,
      investment_amount,
      investment_id,
      transaction_amount,
      transaction_fee,
      user_id,
    } = req.body;

    const cryptoTransaction = await CryptoTransaction.create({
      investment_id,
      investment_amount,
      phase: "pending",
      deal_id,
      deal_name,
      investor_name,
      transaction_amount,
      transaction_currency: req.body.transaction_currency ?? "USD",
      transaction_fee,
      user_id,
    });

    res.send(cryptoTransaction);

    await initializeCryptoTransaction(
      cryptoTransaction,
      req.headers["x-api-token"] as string
    );
    
  } catch (e) {
    next(e);
  }
});
