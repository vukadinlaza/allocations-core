import { HttpError } from "@allocations/api-common";
import { WalletWithdrawal } from "@allocations/core-models";
import { RequestHandler, Request } from "express";
import _ from "lodash";
import { verifyCoinbaseWalletSignature } from "../../../../utils/crypto/coinbase";

type CoinbaseWithdrawalWebhookPayload = {
  readonly id: string; // id for THE NOTIFICATION
  readonly type: string; //wallet:withdrawal:completed,
  readonly delivery_attempts: number; // attempts to deliver this notification
  readonly resource: string; // resource type, notification,
  readonly data: {
    // data about the withdrawal
    readonly id: string; // id for the withdrawal
    readonly status: string; // completed, cancelled
    readonly payment_method: {
      readonly id: string;
      readonly resource_path: string;
    };
  };
};

export const updateWalletWithdrawal: RequestHandler = async (
  req: Request<{}, {}, CoinbaseWithdrawalWebhookPayload, {}, {}>,
  res,
  next
) => {
  try {
    // 1. verify webhook signature and body.

    const signature = req.header("CB-SIGNATURE");
    if (!signature) {
      throw new HttpError("CB-SIGNATURE missing", 400);
    }
    if (_.isEmpty(req.body)) {
      throw new Error("request body expected");
    }
    if (
      !verifyCoinbaseWalletSignature({
        body: JSON.stringify(req.body),
        signature,
      })
    ) {
      throw new HttpError("unauthorized request", 401);
    }

    const {
      id: event_id,
      type,
      data: { id, status },
    } = req.body;

    const eventType = type.split(":");
    const eventStatus = eventType.pop();

    if (!["wallet", "withdrawal"].every((val, i) => val === eventType[i])) {
      throw new Error("event type is not wallet withdrawal");
    }
    if (eventStatus !== status) {
      throw new Error("event status does not match withdrawal status");
    }

    const foundWithdrawal = await WalletWithdrawal.findOne({
      "metadata.coinbase_id": id,
    });

    if (!foundWithdrawal) {
      throw new HttpError("unable to find matching withdrawal");
    }

    const walletUpdates: Partial<WalletWithdrawal> = {
      phase: status,
    };

    if (status === "completed") {
      walletUpdates.metadata?.set("coinbase_confirmation_event_id", event_id);
    }

    await WalletWithdrawal.findByIdAndUpdate(foundWithdrawal._id, {
      $set: walletUpdates,
    });

    res.status(200).send({ acknowledged: true });
  } catch (e) {
    next(e);
  }
};
