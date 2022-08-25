import type { SQSEvent } from "aws-lambda";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import { PlaidAccount, PlaidTransaction } from "@allocations/core-models";
import { Configuration, PlaidEnvironments, PlaidApi } from "plaid";

const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENVIRONMENT!],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
    },
  },
});

const client = new PlaidApi(configuration);

export const handler = async ({ Records }: SQSEvent) => {
  await connectMongoose();

  for (const record of Records) {
    try {
      const { Message } = JSON.parse(record.body);
      const { _id } = JSON.parse(Message);
      const account = await PlaidAccount.findById(_id).select("+access_token");
      if (!account) continue;

      const { data } = await client.transactionsSync({
        access_token: account.access_token,
        cursor: account.next_cursor,
      });

      await Promise.all(
        data.added.map(async (transaction) => {
          await PlaidTransaction.create({
            plaid_account: account._id,
            plaid_transaction_id: transaction.transaction_id,
            name: transaction.name,
            amount: transaction.amount,
            type: transaction.amount < 0 ? "Credit" : "Debit",
            status: transaction.pending ? "Pending" : "Complete",
            date: transaction.datetime || transaction.date,
          });
        })
      );

      await Promise.all(
        data.modified.map(async (transaction) => {
          await PlaidTransaction.findByIdAndUpdate(
            { plaid_transaction_id: transaction.transaction_id },
            {
              plaid_account: account._id,
              name: transaction.name,
              amount: transaction.amount,
              type: transaction.amount < 0 ? "Credit" : "Debit",
              status: transaction.pending ? "Pending" : "Complete",
              date: transaction.datetime,
            }
          );
        })
      );

      await Promise.all(
        data.removed.map(async (transaction) => {
          await PlaidTransaction.findOneAndDelete({
            plaid_transaction_id: transaction.transaction_id,
          });
        })
      );

      await PlaidAccount.findByIdAndUpdate(account._id, {
        next_cursor: data.next_cursor,
      });

      await triggerTransition({
        id: account._id.toString(),
        action: data.has_more ? "MORE" : "COMPLETE",
        phase: "syncing",
      });
    } catch (err: any) {
      console.error(err);
    }
  }
};
