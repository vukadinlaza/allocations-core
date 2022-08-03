import mongoose, { Document, Schema } from "mongoose";

export interface InvestorPassport extends Document {
  phase: string;
  name: string;
  type: "Entity" | "Individual";
  title: string | null;
  representative: string | null;
  country: string | null;
  accreditation_type: string;
  metadata: Map<string, any>;
  updated_at: Date;
  created_at: Date;
}

const schema: Schema = new mongoose.Schema(
  {
    phase: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["Entity", "Individual"],
      required: true,
    },
    title: {
      type: String,
      default: null,
    },
    representative: {
      type: String,
      default: null,
    },
    country: {
      type: String,
      default: null,
    },
    accreditation_type: {
      type: String,
      default: null,
    },
    metadata: Map,
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

schema.index({ name: 1 });

schema.virtual("tax_information", {
  ref: "TaxInformation",
  localField: "_id",
  foreignField: "passport_id",
  justOne: true,
});

export const InvestorPassport = mongoose.model<InvestorPassport>(
  "InvestorPassport",
  schema
);
