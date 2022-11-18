import mongoose, { Schema, Document, Types } from "mongoose";

export interface CryptoOption extends Document {
  crypto_payments: boolean;
  deal_id: Types.ObjectId;
  deal_name: string;
  activated_user: string;
}

const CryptoOptionSchema: Schema = new mongoose.Schema(
  {
    crypto_payments: {
      type: Schema.Types.Boolean,
      required: true,
      default: false,
    },
    deal_id: {
      type: Schema.Types.ObjectId,
      ref: "Deal",
      required: true,
    },
    deal_name: {
      type: String,
      required: true,
    },
    activated_user: String,
  },
  { timestamps: true, toJSON: { virtuals: true } }
);

CryptoOptionSchema.virtual("deal", {
  ref: "Deal",
  localField: "deal_id",
  foreignField: "_id",
  justOne: true,
});

export const CryptoOption = mongoose.model<CryptoOption>(
  "CryptoOption",
  CryptoOptionSchema
);
