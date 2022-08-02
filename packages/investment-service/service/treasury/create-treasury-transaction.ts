import { Account, Transaction } from "@allocations/core-models";
import { Investment } from "@allocations/core-models";
import { connectMongoose } from "@allocations/service-common";
import { SNSEvent } from "aws-lambda";
import fetch from "node-fetch";

interface TransactionResponse extends Transaction {
  error: string;
  status: number;
}

export const handler = async ({ Records }: SNSEvent) => {
  await connectMongoose();
  for (const record of Records) {
    const { _id, metadata }: Investment = JSON.parse(record.Sns.Message);
    const investment = await Investment.findById(_id);
    if (!investment)
      throw new Error(`Unable to find investment with id ${_id}`);
    //@ts-ignore
    const deal_id = metadata.deal_id;

    const accountResponse = await fetch(
      `${process.env.TREASURY_SERVICE_URL}/api/v1/accounts?deal_id=${deal_id}`,
      {
        headers: {
          "X-API-TOKEN": process.env.ALLOCATIONS_TOKEN!,
        },
      }
    );
    const account: Account = await accountResponse.json();
    if (!account) throw new Error("unable to find treasury account");
    const transactionResponse = await fetch(
      `${process.env.TREASURY_SERVICE_URL}/api/v1/transactions`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-API-TOKEN": process.env.ALLOCATIONS_TOKEN!,
        },
        body: JSON.stringify({
          phase: "new",
          provider: account.provider,
          account: account._id,
          investor_name: investment.investor_name,
          investment_id: investment._id,
          committed_amount: investment.total_committed_amount,
          metadata: {
            deal_id: investment?.metadata.get("deal_id") || null,
            investor_email: investment.investor_email,
          },
        }),
      }
    );
    const transaction: TransactionResponse = await transactionResponse.json();
    if (!transaction._id) {
      throw new Error(
        `unable to find transaction in createTreasuryTransaction with investment id ${investment._id}`
      );
    }
    const updatedInvestment = await Investment.findByIdAndUpdate(
      investment._id,
      {
        $push: {
          transactions: {
            treasury_transaction_id: transaction._id,
            committed_amount: investment.total_committed_amount,
          },
        },
      }
    );
    if (!updatedInvestment)
      throw new Error(
        `unable to update investment ${investment._id} with transaction ${transaction._id}`
      );
  }
};
