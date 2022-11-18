import mongoose, { Schema, Document, Types } from "mongoose";

type WalletWithdrawalMetadataKeys =
  | "coinbase_id"
  | "coinbase_confirmation_event_id"
  | "coinbase_payout_time"
  | "coinbase_resource_path";

export interface WalletWithdrawal extends Document {
  deal_id: Types.ObjectId;
  metadata: Map<WalletWithdrawalMetadataKeys, string | number | boolean>;
  // the coinbase payment-method-id associated with the account withdrawn TO
  payment_method_id: string;
  phase: string; // coinbase status
  withdrawal_amount: number;
  withdrawal_currency: string;
}

const WalletWithdrawalSchema: Schema = new mongoose.Schema(
  {
    deal_id: { type: Schema.Types.ObjectId, ref: "Deal", required: true },
    metadata: Map,
    payment_method_id: String,
    phase: {
      type: String,
      required: true,
    },
    withdrawal_amount: Number,
    withdrawal_currency: String,
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

WalletWithdrawalSchema.virtual("deal", {
  ref: "Deal",
  localField: "deal_id",
  foreignField: "_id",
  justOne: true,
});

export const WalletWithdrawal = mongoose.model<WalletWithdrawal>(
  "WalletWithdrawal",
  WalletWithdrawalSchema
);
