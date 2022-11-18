/**
 * This handler will return a transaction by transaction_id
 */

import { HttpError } from "@allocations/api-common";
import { RequestHandler } from "express";
import { CryptoTransaction } from "@allocations/core-models";

export const getCryptoTransactionById: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const {
      params: { id },
    } = req;

    const foundTransaction = await CryptoTransaction.findById(id).populate(
      "investment"
    );

    if (!foundTransaction) {
      throw new HttpError(`Matching transaction not found`, 404);
    }
    res.send(foundTransaction);
  } catch (e) {
    next(e);
  }
};
