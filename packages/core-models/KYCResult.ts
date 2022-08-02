import mongoose, { Document, Schema } from "mongoose";

export interface KYCResult extends Document {
  passport_id: mongoose.Types.ObjectId;
  passed: boolean;
  raw: Map<string, any>;
  created_at: string;
}

const KYCResultSchema: Schema = new mongoose.Schema(
  {
    passport_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "InvestorPassport",
      required: true,
    },
    passed: {
      type: Boolean,
      required: false,
    },
    raw: {
      type: Map,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

export const KYCResult = mongoose.model<KYCResult>(
  "KYCResult",
  KYCResultSchema
);
