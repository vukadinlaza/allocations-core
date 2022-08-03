import mongoose, { Schema, Document, Types } from "mongoose";

export interface Investment extends Document {
  _id: Types.ObjectId;
  deal_id: Types.ObjectId;
  user_id: Types.ObjectId;
  passport_id?: Types.ObjectId;
  phase: string;
  investor_email: string;
  investor_name: string | null;
  total_committed_amount: number | null;
  transactions: [Transaction];
  investor_type: string | null;
  investor_entity_name: string | null;
  investor_country: string | null;
  investor_state: string | null;
  accredited_investor_type: string | null;
  custom_carry_fee: string | null;
  carry_fee_percent: number | null;
  management_fee_percent: number | null;
  custom_management_fee: string | null;
  management_fee_frequency: string;
  metadata: Map<string, any>;
  submission_data: Map<string, any>;
}

interface Transaction extends Document {
  _id: Types.ObjectId;
  committed_amount: number | null;
  is_crypto: boolean | null;
  treasury_transaction_id: Types.ObjectId | null;
  wired_amount: number | null;
  wired_date: Date | null;
}

const transactionSchema: Schema = new mongoose.Schema({
  treasury_transaction_id: {
    type: Schema.Types.ObjectId,
    default: null,
  },
  committed_amount: {
    type: Number,
    default: null,
  },
  is_crypto: {
    type: Boolean,
    default: false,
  },
  wired_date: {
    type: Date,
    default: null,
  },
  wired_amount: {
    type: Number,
    default: null,
  },
});

const schema = new mongoose.Schema(
  {
    deal_id: {
      type: Schema.Types.ObjectId,
      ref: "Deal",
      required: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      defatult: null,
    },
    passport_id: {
      type: Schema.Types.ObjectId,
    },
    phase: {
      type: String,
      required: true,
    },
    total_committed_amount: {
      type: Number,
      default: null,
    },
    investor_name: {
      type: String,
      default: null,
    },
    investor_email: {
      type: String,
      required: true,
    },
    transactions: {
      type: [transactionSchema],
      default: [],
    },
    investor_type: {
      type: String,
      enum: ["Entity", "Individual", "Trust", null],
      nullable: true,
      default: null,
    },
    investor_entity_name: {
      type: String,
      defatult: null,
    },
    investor_country: {
      type: String,
      defatult: null,
    },
    investor_state: {
      type: String,
      defatult: null,
    },
    accredited_investor_type: {
      type: String,
      defatult: null,
    },
    custom_carry_fee: {
      type: String,
      default: null,
    },
    carry_fee_percent: {
      type: Number,
      default: null,
    },
    management_fee_percent: {
      type: Number,
      default: null,
    },
    custom_management_fee: {
      type: String,
      default: null,
    },
    management_fee_frequency: {
      type: String,
    },
    metadata: Map,
    submission_data: Map,
  },
  { timestamps: true }
);

schema.virtual("deal", {
  ref: "Deal",
  localField: "deal_id",
  foreignField: "_id",
  justOne: true,
});

export const Investment = mongoose.model<Investment>("Investment", schema);

export const Transaction = mongoose.model<Transaction>(
  "Transaction",
  transactionSchema
);
