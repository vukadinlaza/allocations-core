/**
 * This handler will return a crypto payment options by deal_id
 */

import { HttpError } from "@allocations/api-common";
import { CryptoOption } from "@allocations/core-models";
import { RequestHandler } from "express";

export const getCryptoOptionByDealId: RequestHandler = async (
  req,
  res,
  next
) => {
  try {
    const {
      params: { deal_id },
    } = req;

    const foundOption = await CryptoOption.findOne({ deal_id });

    if (!foundOption) {
      throw new HttpError(`Options for deal not found`, 404);
    }
    res.send(foundOption);
  } catch (e) {
    next(e);
  }
};
