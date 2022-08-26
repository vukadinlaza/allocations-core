import mongoose, { Document } from "mongoose";

export interface StripePayout extends Document {
  phase: "created" | "paid" | "failed";
  stripe_account_id: mongoose.Types.ObjectId;
  deal_id: mongoose.Types.ObjectId;

  stripe_payout_id: string;
  amount: number;
  arrival_date: Date;
  failure_message?: string;

  updated_at: Date;
  created_at: Date;
}

const schema = new mongoose.Schema<StripePayout>(
  {
    phase: {
      type: String,
      enum: ["created", "paid", "failed"],
      required: true,
    },
    stripe_account_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "StripeAccount",
      required: true,
    },
    deal_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Deal",
      required: true,
    },
    stripe_payout_id: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    arrival_date: {
      type: Date,
      required: true,
    },
    failure_message: {
      type: String,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const StripePayout = mongoose.model<StripePayout>(
  "StripePayout",
  schema
);
