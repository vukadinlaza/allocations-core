import mongoose, { Document } from "mongoose";

export interface PlaidAccount extends Document {
  phase: "new" | "syncing" | "synced" | "closed";
  deal_id: mongoose.Types.ObjectId;
  plaid_item_id: string;
  access_token: string;
  account_name: string;
  account_number: string;
  routing_number: string;
  next_cursor?: string;

  notes: string;

  updated_at: Date;
  created_at: Date;
}

const schema = new mongoose.Schema<PlaidAccount>(
  {
    phase: {
      type: String,
      enum: ["new", "syncing", "synced", "closed"],
      required: true,
    },
    deal_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Deal",
      required: true,
    },
    account_name: {
      type: String,
      required: true,
    },
    plaid_item_id: {
      type: String,
      required: true,
    },
    access_token: {
      type: String,
      required: true,
    },
    account_number: {
      type: String,
      required: true,
    },
    routing_number: {
      type: String,
      required: true,
    },
    next_cursor: {
      type: String,
    },
    notes: {
      type: String,
      default: "",
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
        delete ret.access_token;
        return ret;
      },
    },
  }
);

export const PlaidAccount = mongoose.model<PlaidAccount>(
  "PlaidAccount",
  schema
);
