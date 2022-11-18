/*a handler that:
 *1. verifies webhook signature
 *2. receives a charge payload from the commerce api
 *3. updates the CryptoTransaction doc based on status
 */

import { HttpError, logger } from "@allocations/api-common";
import { CryptoTransaction } from "@allocations/core-models";
import axios from "axios";
import { RequestHandler, Request } from "express";
import _ from "lodash";
import { cryptoTransactionsAddRow } from "../../../../utils/airtable/crypto/write-airtable";
import { verifyCoinbaseCommerceSignature } from "../../../../utils/crypto/coinbase";

type CoinbasePayment = {
  network: string; // eth, btc
  transaction_id: string; // transaction hash
  status: string; // transaction status
  value: {
    local: { amount: string; currency: string }; // fiat (USD)
    crypto: { amount: string; currency: string }; // token (ETH, BTC)
  };
  block: {
    height: number;
    hash: string; // transaction hash
    confirmations_accumulated: number;
    confirmations_required: number;
  };
};

type CoinbaseChargeWebhookPayload = {
  readonly event: {
    readonly id: string;
    readonly resource: string; // "event"
    readonly type: string; // "charge:confirmed, failed, delayed"
    readonly data: {
      readonly code: string; // the charge code
      readonly metadata: {
        readonly investor_id: string;
        readonly investor_name: string;
        readonly transaction_id: string;
      };
      readonly payments: CoinbasePayment[];
      readonly addresses: {
        readonly bitcoin?: string; //
        readonly ethereum?: string; //
      };
    };
  };
};

export const updateCryptoTransaction: RequestHandler = async (
  req: Request<{}, {}, CoinbaseChargeWebhookPayload, {}, {}>,
  res,
  next
) => {
  logger.info(req.body, "PAYLOAD");
  try {
    // 1. Verify webhook signature and payload
    const sigHeader = req.header("X-CC-Webhook-Signature");
    if (!sigHeader) {
      throw new HttpError("X-CC-Webhook-Signature missing", 400);
    }

    if (_.isEmpty(req.body)) {
      throw new Error("request body expected");
    }

    if (
      !verifyCoinbaseCommerceSignature({
        payload: JSON.stringify(req.body),
        sigHeader,
      })
    ) {
      logger.error(
        {
          sigHeader,
          body: JSON.stringify(req.body),
        },
        "Error verifying webhook request"
      );
      // throw new HttpError("unauthorized request", 401);
    }

    // 2. Look at that charge payload!
    // Needs payload validation eventually
    const {
      event: {
        type,
        data: { code, metadata, payments },
      },
    } = req.body;

    // 3. Sanity check before updating.
    const foundTransaction = await CryptoTransaction.findById(
      metadata.transaction_id
    );

    if (!foundTransaction) {
      logger.error(
        {
          transaction_id: metadata.transaction_id,
          coinbase_charge_code: code,
        },
        `Transaction ${metadata.transaction_id} not found`
      );
      throw new HttpError("unable to find matching transaction", 200);
    }
    if (foundTransaction.metadata.get("coinbase_charge_code") !== code) {
      logger.error(
        {
          transaction_id: metadata.transaction_id,
          coinbase_charge_code: code,
        },
        `Transaction does not match coinbase charge code`
      );
      throw new HttpError("charge does not match transaction", 200);
    }

    // determine phase from coinbase
    const phase = type.split(":")[1];

    // determine amount actually received from coinbase (this should rarely be different than investment_amount_expected)
    const coinbase_amount_received = payments.length
      ? parseFloat(payments[0].value.local.amount)
      : undefined;
    const investment_amount_received = coinbase_amount_received
      ? coinbase_amount_received / 1.015
      : undefined;
    const transaction_fee =
      coinbase_amount_received && investment_amount_received
        ? coinbase_amount_received - investment_amount_received
        : undefined;

    const investment_amount_received_with_fee = coinbase_amount_received
      ? coinbase_amount_received - coinbase_amount_received * 0.01
      : undefined;

    const transactionUpdates = {
      phase,
      investment_amount_received,
      transaction_fee,
      investment_amount_received_with_fee,
    };

    let metadataUpdates;

    if (req.body.event.data.payments.length > 0) {
      const { network, transaction_id } = req.body.event.data.payments[0];

      metadataUpdates = {
        "metadata.coinbase_transaction_network": network,
        "metadata.coinbase_transaction_hash": transaction_id,
      };
    }

    // 4. Update CryptoTransaction record!
    const updatedTransaction = await CryptoTransaction.findByIdAndUpdate(
      metadata.transaction_id,
      {
        $set: { ...transactionUpdates, ...metadataUpdates },
      },
      { returnDocument: "after" }
    );

    if (!updatedTransaction) {
      throw new Error("Updating transaction with payment info failed");
    }

    const { data } = await axios({
      url: "https://api.airtable.com/v0/appLhEikZfHgNQtrL/Crypto%20Transfers",
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
    });

    const matchingRecord = data.records.find(
      (record: {
        id: string;
        createdTime: string;
        fields: { [key: string]: any };
      }) =>
        record.fields?.["Mongo Investment Id"] ===
        updatedTransaction.investment_id.toString()
    );

    if ((phase === "confirmed" || phase === "resolved") && !matchingRecord) {
      logger.info(req, "REQUEST BODY");
      logger.info(updatedTransaction, "UPDATED TRANSACTION");
      // 4.1 Update Air table here?
      const amount =
        Number(
          (
            updatedTransaction.investment_amount_received +
            updatedTransaction.transaction_fee
          ).toFixed(2)
        ) || updatedTransaction?.transaction_amount;

      const date = new Date().toLocaleDateString();
      await cryptoTransactionsAddRow({
        amount,
        date,
        deal_id: updatedTransaction.metadata.get("deal_id") as string,
        deal_name:
          (updatedTransaction?.metadata.get("deal_name") as string) ??
          "deal name not found",
        investment_id: updatedTransaction.investment_id.toString(),
        investment_amount_received:
          updatedTransaction.investment_amount_received ?? undefined,
        investment_amount_received_with_fee:
          updatedTransaction.investment_amount_received_with_fee ?? undefined,
        investor_id: updatedTransaction?.user_id
          ? updatedTransaction.user_id.toString()
          : "investor_id not found",
        investor_name:
          (updatedTransaction?.metadata.get("investor_name") as string) ??
          "investor name not found",
        network:
          (updatedTransaction.metadata.get(
            "coinbase_transaction_network"
          ) as string) ?? undefined,
        phase: updatedTransaction.phase,
        transaction_hash:
          (updatedTransaction.metadata.get(
            "coinbase_transaction_hash"
          ) as string) ?? undefined,
        transaction_fee: updatedTransaction.transaction_fee ?? undefined,
      });
    }

    // Coinbase webhooks expect a 200 response
    res.status(200).send({ acknowledged: true });
  } catch (e) {
    next(e);
  }
};
