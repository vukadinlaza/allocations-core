import mongoose, { Document } from "mongoose";

export interface StripeAccount extends Document {
  phase: "connect-pending" | "verification-pending" | "live" | "failed";
  deal_id: mongoose.Types.ObjectId;
  stripe_account_id: string;

  updated_at: Date;
  created_at: Date;
}

const schema = new mongoose.Schema<StripeAccount>(
  {
    phase: {
      type: String,
      enum: ["connect-pending", "verification-pending", "live", "failed"],
      required: true,
    },
    deal_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Deal",
      required: true,
    },
    stripe_account_id: {
      type: String,
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

export const StripeAccount = mongoose.model<StripeAccount>(
  "StripeAccount",
  schema
);
