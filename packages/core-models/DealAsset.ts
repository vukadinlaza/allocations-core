import mongoose, { Document, ObjectId } from "mongoose";

export interface DealAsset extends Document {
  deal_id: ObjectId;
  internal: boolean;
  md5?: string;
  s3_bucket?: string;
  s3_key?: string;
  title: string;
  type:
    | "ein"
    | "cover-image"
    | "pitch-deck"
    | "term-sheet"
    | "deal-wire-instructions"
    | "portfolio-company-wire-instructions"
    | "custom";
  uploaded: boolean;
}

const schema = new mongoose.Schema<DealAsset>(
  {
    title: {
      type: String,
      required: true,
    },
    deal_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Deal",
      required: true,
    },
    uploaded: {
      type: Boolean,
      default: false,
      required: true,
    },
    internal: {
      type: Boolean,
      default: true,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "ein",
        "cover-image",
        "pitch-deck",
        "term-sheet",
        "deal-wire-instructions",
        "portfolio-company-wire-instructions",
      ],
      required: true,
    },
    md5: {
      type: String,
    },
    s3_bucket: {
      type: String,
      select: false,
      required: true,
    },
    s3_key: {
      type: String,
      select: false,
      required: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

schema.virtual("deal", {
  ref: "Deal",
  localField: "deal_id",
  foreignField: "_id",
  justOne: true,
});

export const DealAsset = mongoose.model<DealAsset>(
  "DealAsset",
  schema,
  "deal_assets"
);
