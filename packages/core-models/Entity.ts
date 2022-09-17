import mongoose, { Document } from "mongoose";

export interface Entity extends Document {
  name: string;
  phase: string;
  organization_id: mongoose.Types.ObjectId;
  structure: "LLC" | "LP";
  manager_passport_id: mongoose.Types.ObjectId;
  member_passport_id: mongoose.Types.ObjectId;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  ein?: string;
}

const schema = new mongoose.Schema<Entity>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    phase: {
      type: String,
      enum: [
        "verify-entity",
        "generate-agreements",
        "agreements-pending",
        "kyc",
        "kyc-failed",
        "formation-pending",
        "complete",
      ],
      default: "new",
      required: true,
    },
    organization_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Organization",
      required: true,
    },
    structure: {
      type: String,
      enum: ["LLC", "LP"],
      required: true,
    },
    manager_passport_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "InvestorPassport",
      required: true,
    },
    member_passport_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "InvestorPassport",
      required: true,
    },
    address_line_1: {
      type: String,
    },
    address_line_2: {
      type: String,
    },
    city: {
      type: String,
    },
    state: {
      type: String,
    },
    zip_code: {
      type: String,
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

schema.virtual("organization", {
  ref: "Organization",
  localField: "organization_id",
  foreignField: "_id",
  justOne: true,
});

schema.virtual("manager", {
  ref: "InvestorPassport",
  localField: "manager_passport_id",
  foreignField: "_id",
  justOne: true,
});

schema.virtual("member", {
  ref: "InvestorPassport",
  localField: "member_passport_id",
  foreignField: "_id",
  justOne: true,
});

export const Entity = mongoose.model<Entity>("Entity", schema);
