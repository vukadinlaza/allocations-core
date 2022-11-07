import { PlaidAccount, PlaidTransaction } from "@allocations/core-models";
import moment from "moment";
import { Types } from "mongoose";

//@ts-nocheck
const Airtable = require("airtable");
Airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: process.env.AIRTABLE_API_KEY,
});

const AccountsTable =
  process.env.NODE_ENV === "production" ? "Accounts" : "Accounts Testing";
const TransactionsTable =
  process.env.NODE_ENV === "production"
    ? "Transactions"
    : "Transactions Testing";

const getBase = async () => Airtable.base(process.env.BANKING_AIRTABLE_BASE);

export const createAirtableAccount = async (accountId: Types.ObjectId) => {
  const account = await PlaidAccount.findById(accountId);
  if (!account) return null;

  const base = await getBase();
  const accounts = await base.table(AccountsTable);
  return accounts.create([
    {
      fields: {
        "*Name": account.account_name,
      },
    },
  ]);
};

const getAirtableAccount = async (accountId: Types.ObjectId) => {
  const account = await PlaidAccount.findById(accountId);
  if (!account) return null;

  const filterByFormula = `FIND("${account.account_name}", {*Name})`;
  const base = await getBase();
  const accounts = await base.table(AccountsTable);

  return accounts.select({ filterByFormula }).all();
};

export const createAirtableTransaction = async (
  transaction: PlaidTransaction
) => {
  const base = await getBase();
  const transactions = await base.table(TransactionsTable);

  let matchingAccount = await getAirtableAccount(transaction.plaid_account);
  if (!matchingAccount.length)
    matchingAccount = await createAirtableAccount(transaction.plaid_account);

  await transactions.create([
    {
      fields: {
        "*Name": transaction.name,
        "**Date": moment(transaction.date).calendar(),
        "**USD": transaction.amount,
        "**Account": [matchingAccount[0].id],
        "ND Reference Number": transaction.plaid_transaction_id,
      },
    },
  ]);
};
