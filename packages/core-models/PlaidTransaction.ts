import mongoose, { Document } from "mongoose";

export interface PlaidTransaction extends Document {
  plaid_account: mongoose.Types.ObjectId;
  plaid_transaction_id: string;

  name: string;
  amount: number;
  type: "Credit" | "Debit";
  status: "Pending" | "Posted";
  date?: Date;

  category: String;
  investment_id?: mongoose.Types.ObjectId;

  updated_at: Date;
  created_at: Date;
}

const schema = new mongoose.Schema<PlaidTransaction>(
  {
    plaid_account: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "PlaidAccount",
      required: true,
    },
    plaid_transaction_id: {
      type: String,
      required: true,
    },

    name: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["Credit", "Debit"],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Posted"],
    },
    date: {
      type: Date,
    },

    category: {
      type: String,
    },
    investment_id: {
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

export const PlaidTransaction = mongoose.model<PlaidTransaction>(
  "PlaidTransaction",
  schema
);
