import { CryptoTransaction } from "@allocations/core-models";
import { verifyCoinbaseCommerceSignature } from "../utils/coinbase";
import {
  LambdaEvent,
  parseRequest,
  connectMongoose,
  sendError,
  send,
  sendMessage,
  triggerTransition,
} from "@allocations/service-common";
import { HttpErrorWithID } from "../utils/errors";

export const handler = async (event: LambdaEvent) => {
  try {
    const { body } = parseRequest(event);
    await connectMongoose();
    //coinbase charge data
    const {
      event: {
        type,
        data: { code, metadata, payments },
      },
    } = body;

    //Verify webhook signature and payload
    const sigHeader = event.headers["X-CC-Webhook-Signature"];
    if (!sigHeader) {
      throw new HttpErrorWithID(
        "X-CC-Webhook-Signature missing",
        "400",
        metadata.transaction_id
      );
    }

    if (
      !verifyCoinbaseCommerceSignature({
        payload: JSON.stringify(body),
        sigHeader,
      })
    ) {
      throw new HttpErrorWithID(
        "unauthorized request",
        "401",
        metadata.transaction_id
      );
    }

    const foundTransaction = await CryptoTransaction.findById(
      metadata.transaction_id
    );

    if (!foundTransaction) {
      throw new HttpErrorWithID(
        "unable to find matching transaction",
        "500",
        metadata.transaction_id
      );
    }
    if (foundTransaction.coinbase_charge_code !== code) {
      throw new HttpErrorWithID(
        "charge does not match transaction",
        "500",
        metadata.transaction_id
      );
    }

    // determine phase from coinbase
    const phase = type.split(":")[1];

    if (phase !== "complete" || phase !== "resolved") {
      throw new HttpErrorWithID(
        "coinbase charge failed",
        "500",
        metadata.transaction_id
      );
    }

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

    //Update CryptoTransaction record!
    const updatedTransaction = await CryptoTransaction.findByIdAndUpdate(
      metadata.transaction_id,
      {
        $set: {
          investment_amount_received,
          transaction_fee,
        },
      },
      { returnDocument: "after" }
    );

    if (!updatedTransaction) {
      throw new HttpErrorWithID(
        "Updating transaction with payment info failed",
        "500",
        metadata.transaction_id
      );
    }

    await sendMessage({
      id: foundTransaction.investment_id.toString(),
      app: "core",
      service: "investment-v2",
      event: "reconcile",
      payload: {
        investment_id: foundTransaction.investment_id,
        type: "crypto",
      },
    });

    await triggerTransition({
      id: updatedTransaction._id.toString(),
      action: "CONFIRMED",
      phase: "pending",
    });

    return send({ acknowledged: true, _id: foundTransaction._id });
  } catch (err: any) {
    await triggerTransition({
      id: err.id,
      action: "FAILED",
      phase: "pending",
    });

    return sendError({ error: err, status: err.status });
  }
};
