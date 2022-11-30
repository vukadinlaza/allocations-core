import mongoose, { Document, Schema, Types } from "mongoose";

export interface Migration extends Document {
  migration_from: string;
  requested_completion_date: Date;
  start_date: Date;
  number_of_deals: number;
  first_name: string | null;
  last_name: string | null;
  spv_list: string | null;
  spv_manager_name: string | null;
  has_master_entity: boolean | null;
  has_onboarding_deals: boolean | null;
  assure_products: string | null;
  has_spvs_into_spvs: boolean | null;
  has_follow_on_spvs: boolean | null;
  has_multi_asset_spvs: boolean | null;
  committed_number_of_deals: number | null;
  notes: string | null;
  organization_id: Types.ObjectId | null;
  user_id: Types.ObjectId;
}

const MigrationSchema = new Schema({
  migration_from: { type: String, required: true },
  requested_completion_date: { type: Date, required: true },
  start_date: { type: Date, required: true },
  number_of_deals: { type: Number, required: true },
  first_name: { type: String, default: null },
  last_name: { type: String, default: null },
  spv_list: { type: String, default: null },
  spv_manager_name: { type: String, default: null },
  has_master_entity: { type: Boolean, default: null },
  has_onboarding_deals: { type: Boolean, default: null },
  assure_products: { type: String, default: null },
  has_spvs_into_spvs: { type: Boolean, default: null },
  has_follow_on_spvs: { type: Boolean, default: null },
  has_multi_asset_spvs: { type: Boolean, default: null },
  committed_number_of_deals: { type: Number, default: null },
  notes: { type: String, default: null },
  organization_id: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Organization",
    default: null,
  },
  user_id: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true,
  },
});

MigrationSchema.virtual("organization", {
  ref: "Organization",
  localField: "organization_id",
  foreignField: "_id",
  justOne: true,
});

export const Migration = mongoose.model<Migration>(
  "Migration",
  MigrationSchema
);
