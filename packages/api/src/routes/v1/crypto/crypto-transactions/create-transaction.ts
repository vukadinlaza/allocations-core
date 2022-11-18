import axios from "axios";

import * as t from "runtypes";

import { CryptoTransaction } from "@allocations/core-models";
import { validateValue } from "../../../../utils/crypto/validate-value";
import { Request, RequestHandler } from "express";
import { coinbaseCommerceHeaders } from "../../../../utils/crypto/coinbase";

type CreateTransactionRequestBody = {
  readonly deal_name: string;
  readonly deal_id: string;
  readonly investor_name: string;
  readonly investment_id: string;
  readonly investment_amount: string;
  readonly transaction_fee: string;
  readonly transaction_amount: number;
  readonly transaction_currency?: string;
  readonly user_id: string;
};

const CreateCoinbaseChargeResponseSchema = t.Record({
  data: t.Record({
    id: t.String,
    code: t.String,
    hosted_url: t.String,
  }),
});

export const createCryptoTransaction: RequestHandler = async (
  req: Request<{}, {}, CreateTransactionRequestBody, {}, {}>,
  res,
  next
) => {
  try {
    // add payload validation
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

    const { _id } = await CryptoTransaction.create({
      investment_id,
      investment_amount,
      phase: "new",
      metadata: {
        deal_id,
        deal_name,
        investor_name,
      },
      transaction_amount,
      transaction_currency: req.body.transaction_currency ?? "USD",
      transaction_fee,
      user_id,
    });

    const { status, data } = await axios({
      method: "POST",
      url: "https://api.commerce.coinbase.com/charges",
      headers: {
        ...coinbaseCommerceHeaders,
        "X-CC-Api-Key": process.env.COINBASE_API_KEY!,
      },
      data: {
        name: deal_name,
        description: `${investor_name}'s investment in ${deal_name}`,
        local_price: {
          amount: transaction_amount,
          currency: req.body.transaction_currency ?? "USD",
        },
        pricing_type: "fixed_price",
        metadata: {
          customer_name: investor_name,
          customer_id: user_id,
          transaction_id: _id,
        },
      },
    });

    if (status > 204) {
      throw new Error(`create charge failed with status ${status}`);
    }

    const validCharge = validateValue({
      schema: CreateCoinbaseChargeResponseSchema,
      value: data,
      errorMessage: "One or more fields missing from coinbase response",
    });

    if (!validCharge.success) {
      throw validCharge.error;
    }

    const { id, code, hosted_url } = validCharge.value.data;

    await CryptoTransaction.findByIdAndUpdate(_id, {
      $set: {
        "metadata.coinbase_charge_code": code,
        "metadata.coinbase_charge_id": id,
        "metadata.coinbase_hosted_url": hosted_url,
        phase: "pending",
      },
    });

    res.send({ _id, hosted_url });
  } catch (e) {
    next(e);
  }
};
