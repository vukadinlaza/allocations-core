import { logger } from "@allocations/api-common";
import axios from "axios";

export type CryptoTransactionsInput = {
  readonly amount?: number;
  readonly date: string;
  readonly deal_id: string;
  readonly deal_name: string;
  readonly investment_id: string;
  readonly investment_amount_received?: number;
  readonly investment_amount_received_with_fee?: number;
  readonly investor_id: string;
  readonly investor_name: string;
  readonly network?: string;
  readonly phase: string;
  readonly transaction_fee?: number;
  readonly transaction_hash?: string;
};

export const cryptoTransactionsAddRow = async ({
  amount,
  date,
  deal_id,
  deal_name,
  investment_id,
  investment_amount_received,
  investment_amount_received_with_fee,
  investor_id,
  investor_name,
  network,
  phase,
  transaction_fee,
  transaction_hash,
}: CryptoTransactionsInput): Promise<void> => {
  // https://airtable.com/appXpU1qJinDRFTsj/tblReU2EyGJwBjSIe/viw9EghcNN96M4iVv?blocks=hide
  if (!process.env.AIRTABLE_API_KEY) {
    throw new Error("Airtable API Key not found");
  }

  try {
    const { status } = await axios({
      method: "POST",
      url: "https://api.airtable.com/v0/appLhEikZfHgNQtrL/Crypto%20Transfers",
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      data: {
        records: [
          {
            fields: {
              Name: `${investor_name} of id: ${investor_id}`,
              Date: date,
              USD: amount,
              "Crypto Currency": network,
              "Transaction Fee": transaction_fee,
              "Net Investor Contribution": investment_amount_received,
              "Amount Transferred": investment_amount_received_with_fee,
              Account: "Coinbase Allocations Fund Admin",
              Deal: deal_name,
              "First Name": investor_name,
              "Transaction Hash": transaction_hash,
              Status: phase,
              "Mongo Investment Id": investment_id,
              "User Id": investor_id,
              "Deal Id": deal_id,
            },
          },
        ],
      },
    });

    if (status > 204) {
      throw new Error(`create charge failed with status ${status}`);
    }
  } catch (e: any) {
    console.log(e.response.data);
    logger.error(e, "Error writing to Crypto Transactions");
    throw new Error(
      `Error writing to Crypto Transactions Airtable: ${e.message}`
    );
  }
};
