import mongoose, { Schema, Document, Types } from "mongoose";

export interface Investment extends Document {
  test: boolean;
  deal_id: Types.ObjectId;
  user_id: Types.ObjectId;
  passport_id?: Types.ObjectId;
  phase: string;
  total_committed_amount: number | null;
  custom_carry_fee: string | null;
  carry_fee_percent: number | null;
  management_fee_percent: number | null;
  management_fee_flat: number | null;
  custom_management_fee: string | null;
  management_fee_frequency: string;
  metadata: Map<string, any>;
}

const schema = new mongoose.Schema(
  {
    test: {
      type: Boolean,
      default: false,
    },
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
    management_fee_flat: {
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
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, toJSON: { virtuals: true }, }
);

schema.virtual("deal", {
  ref: "Deal",
  localField: "deal_id",
  foreignField: "_id",
  justOne: true,
});

export const Investment = mongoose.model<Investment>("Investment", schema);