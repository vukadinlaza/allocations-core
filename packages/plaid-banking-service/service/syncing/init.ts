import type { SQSEvent } from "aws-lambda";
import {
  connectMongoose,
  triggerTransition,
} from "@allocations/service-common";
import { Deal, PlaidAccount, PlaidTransaction } from "@allocations/core-models";
import { Configuration, PlaidEnvironments, PlaidApi } from "plaid";
import { createAirtableTransaction } from "../../utils/banking";

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
      const account = await PlaidAccount.findById(_id)
        .select("+access_token")
        .populate<{ deal_id: Deal }>({ path: "deal_id", justOne: true });
      if (!account) continue;
      const deal = account.deal_id;
      console.log(account, "ACCOUNT");

      const { data } = await client.transactionsSync({
        access_token: account.access_token,
        cursor: account.next_cursor,
      });

      await Promise.all(
        data.added.map(async (transaction) => {
          console.log(transaction, "TRANSACTION");

          const existingTransaction = await PlaidTransaction.findOne({
            plaid_account: account._id,
            plaid_transaction_id: transaction.transaction_id,
          });

          console.log(existingTransaction, "EXISTING TRANSACTION");

          if (!existingTransaction) {
            const plaidTransaction = await PlaidTransaction.create({
              plaid_account: account._id,
              plaid_transaction_id: transaction.transaction_id,
              name: transaction.name,
              amount: transaction.amount * -1,
              type: transaction.amount < 0 ? "Credit" : "Debit",
              status: transaction.pending ? "Pending" : "Posted",
              date: transaction.datetime || transaction.date,
            });

            const transactionObject = plaidTransaction.toObject();

            //@ts-ignore
            await createAirtableTransaction({
              ...transactionObject,
              organization_name: deal.organization_name,
            });
          }
        })
      );

      await Promise.all(
        data.modified.map(async (transaction) => {
          await PlaidTransaction.findByIdAndUpdate(
            { plaid_transaction_id: transaction.transaction_id },
            {
              plaid_account: account._id,
              name: transaction.name,
              amount: transaction.amount * -1,
              type: transaction.amount < 0 ? "Credit" : "Debit",
              status: transaction.pending ? "Pending" : "Posted",
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
