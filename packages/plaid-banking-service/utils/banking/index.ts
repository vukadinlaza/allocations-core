import { Deal, PlaidAccount, PlaidTransaction } from "@allocations/core-models";
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
  const account = await PlaidAccount.findById(accountId).populate<{
    deal_id: Deal;
  }>({
    path: "deal_id",
    justOne: true,
  });
  if (!account) return null;

  const base = await getBase();
  const accounts = await base.table(AccountsTable);
  return accounts.create([
    {
      fields: {
        "*Name": account.account_name,
        "*Account Number": account.account_number,
        "*Routing Number": account.routing_number,
        "*Organization": account.deal_id.organization_name,
      },
    },
  ]);
};

const getAirtableAccount = async (accountId: Types.ObjectId) => {
  const account = await PlaidAccount.findById(accountId);
  if (!account) return null;

  console.log(AccountsTable, "ACCOUNT TABLE");

  const filterByFormula = `FIND("${account.account_name}", {*Name})`;
  const base = await getBase();
  const accounts = await base.table(AccountsTable);

  return accounts.select({ filterByFormula }).all();
};

export const createAirtableTransaction = async (
  transaction: PlaidTransaction & { organization_name: string }
) => {
  const base = await getBase();
  console.log(TransactionsTable, "TRANSACTIONS TABLE");
  const transactions = await base.table(TransactionsTable);

  let matchingAccount = await getAirtableAccount(transaction.plaid_account);
  console.log(matchingAccount, "MATCH FROM GET");
  if (!matchingAccount.length)
    matchingAccount = await createAirtableAccount(transaction.plaid_account);
  console.log(matchingAccount, "MATCH FROM CREATE");

  await transactions.create([
    {
      fields: {
        "*Name": transaction.name,
        "*Organization": transaction.organization_name,
        "**Date": moment(transaction.date).format("MM/DD/YYYY"),
        "**USD": transaction.amount,
        "**Account": [matchingAccount[0].id],
        "ND Reference Number": transaction.plaid_transaction_id,
        "*Notes": JSON.stringify(transaction),
      },
    },
  ]);
};
