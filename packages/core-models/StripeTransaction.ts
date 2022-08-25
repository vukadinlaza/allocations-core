import mongoose, { Document } from "mongoose";

export interface StripeTransaction extends Document {
  phase: "new" | "processing" | "succeeded" | "failed";
  type: "initial-drawdown" | "capital-call";
  deal_id: mongoose.Types.ObjectId;
  stripe_account_id: mongoose.Types.ObjectId;
  stripe_payment_intent_id: string;
  amount: number;

  updated_at: Date;
  created_at: Date;
}

const schema = new mongoose.Schema<StripeTransaction>(
  {
    phase: {
      type: String,
      enum: ["new", "processing", "succeeded", "failed"],
      required: true,
    },
    stripe_account_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "StripeAccount",
      required: true,
    },
    stripe_payment_intent_id: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
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

export const StripeTransaction = mongoose.model<StripeTransaction>(
  "StripeAccount",
  schema
);
