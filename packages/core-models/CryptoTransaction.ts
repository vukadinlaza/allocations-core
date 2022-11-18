import mongoose, { Schema, Document, Types } from "mongoose";

type CryptoTransactionMetadataKeys =
  | "coinbase_charge_code"
  | "coinbase_charge_id"
  | "coinbase_hosted_url"
  | "coinbase_transaction_network"
  | "coinbase_transaction_hash"
  | "deal_name"
  | "deal_id"
  | "investor_name";

export interface CryptoTransaction extends Document {
  investment_amount_expected: number;
  investment_amount_received: number;
  investment_amount_received_with_fee: number;
  investment_id: Types.ObjectId;
  metadata: Map<CryptoTransactionMetadataKeys, string | number | boolean>;
  phase: string; // pending, complete, cancelled, failed, (expired?)
  transaction_amount: number;
  transaction_currency: string;
  transaction_fee: number;
  user_id: Types.ObjectId;
}

const CryptoTransactionSchema: Schema = new mongoose.Schema(
  {
    investment_amount_expected: Number,
    investment_amount_received: Number,
    investment_amount_received_with_fee: Number,
    investment_id: {
      type: Schema.Types.ObjectId,
      ref: "Investment",
      required: true,
    },
    metadata: Map,
    phase: {
      type: String,
      required: true,
    },
    transaction_amount: Number,
    transaction_currency: String,
    transaction_fee: Number,
    user_id: Schema.Types.ObjectId,
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

CryptoTransactionSchema.virtual("investment", {
  ref: "Investment",
  localField: "investment_id",
  foreignField: "_id",
  justOne: true,
});

export const CryptoTransaction = mongoose.model<CryptoTransaction>(
  "CryptoTransaction",
  CryptoTransactionSchema
);
