/**
 * This will be a handler that takes in a deal_id
 * Returns all transactions by deal_id
 * Optional filter by one or more phases
 *
 * Feel like this will probably power a dashboard
 */

import _ from "lodash";
// import { HttpError } from "@allocations/api-common";
import { RequestHandler } from "express";
import { CryptoTransaction } from "@allocations/core-models";

export const getCryptoTransactionsByQuery: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const { query } = req;
    let foundTransactions: CryptoTransaction[] = [];

    if (query.deal_id) {
      foundTransactions = await CryptoTransaction.find({
        "metadata.deal_id": {
          $eq: query.deal_id.toString(),
        },
      });
    } else if (query.user_id) {
      foundTransactions = await CryptoTransaction.find({
        user_id: query.user_id.toString(),
      });
    } else if (foundTransactions.length < 1) {
      throw new Error(`Matching transactions not found`);
    }

    res.send(foundTransactions);
  } catch (e) {
    next(e);
  }
};
