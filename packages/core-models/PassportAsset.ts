import mongoose, { Document, Schema } from "mongoose";

export interface PassportAsset extends Document {
  passport_id: mongoose.Types.ObjectId;
  type: "tax-form" | "government-issued-id" | "proof-of-residence";
  bucket: string;
  path: string;
  updated_at: Date;
  created_at: Date;
}

const PassportAssetSchema: Schema = new mongoose.Schema(
  {
    passport_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "InvestorPassport",
      required: true,
    },
    type: {
      type: String,
      enum: ["tax-form", "government-issued-id", "proof-of-residence"],
      required: true,
    },
    bucket: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export const PassportAsset = mongoose.model<PassportAsset>(
  "PassportAsset",
  PassportAssetSchema
);
