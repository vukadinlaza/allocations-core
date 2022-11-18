import { WalletWithdrawal } from "@allocations/core-models";
import axios from "axios";
import { RequestHandler, Request } from "express";
import * as t from "runtypes";
import { signCoinbaseRequest } from "../../../../utils/crypto/coinbase";
import { validateValue } from "../../../../utils/crypto/validate-value";

type CreateWithdrawalRequsetBody = {
  readonly deal_id: string;
  readonly withdrawal_amount: number;
  readonly withdrawal_currency?: string;
};

const createCoinbaseWalletWithdrawalResponseSchema = t.Record({
  data: t.Record({
    id: t.String,
    status: t.String,
    transaction: t.Record({
      id: t.String,
      resource: t.String,
      resource_path: t.String,
    }),
    resource_path: t.String,
    payout_at: t.String,
  }),
});

export const createWalletWithdrawal: RequestHandler = async (
  req: Request<{}, {}, CreateWithdrawalRequsetBody, {}, {}>,
  res,
  next
) => {
  try {
    // yeesh. need a better solution for the coinbase accountID (wallet)
    // and the payment_method_id (bank account id)
    const coinbase_account_id = process.env.COINBASE_ACCT_ID;
    const { deal_id, withdrawal_amount } = req.body;
    const method = "POST";
    const url = `https://api.coinbase.com/v2/accounts/${coinbase_account_id}/withdrawals`;
    const requestBody = JSON.stringify({
      amount: withdrawal_amount,
      currency: req.body.withdrawal_currency ?? "USD",
      payment_method: process.env.COINBASE_PAYMENT_METHOD!,
    });
    const { cb_access_sign, cb_access_timestamp } = signCoinbaseRequest({
      method,
      path: url,
      requestBody,
    });

    const headers = {
      "CB-ACCESS-KEY": process.env.COINBASE_WALLET_API_KEY!,
      "CB-ACCESS-SIGN": cb_access_sign,
      "CB-ACCESS-TIMESTAMP": cb_access_timestamp,
    };

    const { status: responseStatus, data } = await axios({
      method: "POST",
      url,
      headers,
      data: requestBody,
    });

    if (responseStatus > 204) {
      throw new Error(`Create withdrawal failed with status ${responseStatus}`);
    }

    const validWithdrawal = validateValue({
      schema: createCoinbaseWalletWithdrawalResponseSchema,
      value: data,
      errorMessage: "One or more fields missing from coinbase response",
    });

    if (!validWithdrawal.success) {
      throw validWithdrawal.error;
    }

    const { id, payout_at, resource_path, status } = validWithdrawal.value.data;

    const { _id } = await WalletWithdrawal.create({
      deal_id,
      payment_method_id: process.env.COINBASE_PAYMENT_METHOD,
      metadata: {
        coinbase_id: id,
        coinbase_payout_time: payout_at,
        coinbase_resource_path: resource_path,
      },
      phase: status,
      withdrawal_amount,
      withdrawal_currency: req.body.withdrawal_currency ?? "USD",
    });

    res.send({ _id, coinbase_resource_path: resource_path });
  } catch (e) {
    next(e);
  }
};
