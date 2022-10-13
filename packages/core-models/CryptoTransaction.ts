import mongoose, { Document, Types } from "mongoose";

export interface CryptoTransaction extends Document {
  coinbase_charge_code: string;
  coinbase_charge_id: string;
  coinbase_hosted_url: string;
  deal_id: Types.ObjectId;
  deal_name: string;
  investment_amount_expected: number;
  investment_amount_received: number;
  investment_id: Types.ObjectId;
  investor_name: string;
  phase: "pending" | "complete" | "failed";
  transaction_amount: number;
  transaction_currency: string;
  transaction_fee: number;
  user_id: Types.ObjectId;

  updated_at: Date;
  created_at: Date;
}

const schema = new mongoose.Schema<CryptoTransaction>(
  {
    coinbase_charge_code: String,
    coinbase_charge_id: String,
    coinbase_hosted_url: String,
    deal_id: {
      type: mongoose.SchemaTypes.ObjectId,
    },
    deal_name: String,
    investment_amount_expected: Number,
    investment_amount_received: Number,
    investment_id: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
    },
    investor_name: String,
    phase: {
      type: String,
      required: true,
    },
    transaction_amount: Number,
    transaction_currency: String,
    transaction_fee: Number,
    user_id: {
      type: mongoose.SchemaTypes.ObjectId,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export const CryptoTransaction = mongoose.model<CryptoTransaction>(
  "CryptoTransaction",
  schema
);
