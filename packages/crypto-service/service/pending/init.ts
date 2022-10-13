import { CryptoTransaction } from "@allocations/core-models";
import {
  connectMongoose,
  LambdaResponse,
  send,
  sendError,
  HttpError,
} from "@allocations/service-common";
import { SQSEvent } from "aws-lambda";
export const handler = async ({
  Records,
}: SQSEvent): Promise<LambdaResponse> => {
  try {
    await connectMongoose();

    for (const record of Records) {
      const { Message } = JSON.parse(record.body);

      const {
        deal_name,
        investor_name,
        transaction_amount,
        transaction_currency,
        user_id,
        _id,
      } = JSON.parse(Message) as CryptoTransaction;

      const res = await fetch("https://api.commerce.coinbase.com/charges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CC-Version": "2018-03-22",
          "X-CC-Api-Key": process.env.COINBASE_API_KEY!,
        },
        body: JSON.stringify({
          name: deal_name,
          description: `${investor_name}'s investment in ${deal_name}`,
          local_price: {
            amount: transaction_amount,
            currency: transaction_currency,
          },
          pricing_type: "fixed_price",
          metadata: {
            customer_name: investor_name,
            customer_id: user_id,
            transaction_id: _id,
          },
        }),
      });

      if (res.status > 204) {
        throw new HttpError("create charge failed", String(res.status));
      }

      const { id, code, hosted_url } = await res.json();

      if (!id || !code || !hosted_url) {
        throw new HttpError(
          "One or more fields missing from coinbase response",
          "500"
        );
      }

      await CryptoTransaction.findByIdAndUpdate(_id, {
        coinbase_charge_code: code,
        coinbase_charge_id: id,
        coinbase_hosted_url: hosted_url,
      });
    }

    return send({ acknowledged: true });
  } catch (err: any) {
    console.error(err);
    return sendError({ error: err as Error, status: "500" });
  }
};
