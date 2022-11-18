import { RequestHandler, Request } from "express";
import { CryptoOption } from "@allocations/core-models";

type CreateCryptoOptionRequestBody = {
  readonly activated_user: string;
  readonly crypto_payments: boolean;
  readonly deal_name: string;
  readonly deal_id: string;
};
export const createCryptoOption: RequestHandler = async (
  req: Request<{}, {}, CreateCryptoOptionRequestBody, {}, {}>,
  res,
  next
) => {
  try {
    const { deal_id, deal_name, crypto_payments, activated_user } = req.body;

    const newOption = await CryptoOption.findOneAndUpdate(
      { deal_id },
      {
        deal_id,
        deal_name,
        crypto_payments,
        activated_user,
      },
      { upsert: true, new: true }
    );

    if (!newOption) {
      throw new Error("Creating Crypto Option Failed");
    }

    res.send({ recorded: true, deal_id, deal_name, option_id: newOption._id });
  } catch (e) {
    console.log("error", e);
    next(e);
  }
};
