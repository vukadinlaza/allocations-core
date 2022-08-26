import mongoose, { Document, ObjectId } from "mongoose";

export interface OrganizationFundManager extends Document {
  passport_id: ObjectId;
  organization_id: ObjectId;
  role: string;
}

const schema = new mongoose.Schema<OrganizationFundManager>(
  {
    passport_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "InvestorPassport",
      required: true,
    },
    organization_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Organization",
      required: true,
    },
    role: {
      type: String,
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

schema.virtual("organization", {
  ref: "Organization",
  localField: "organization_id",
  foreignField: "_id",
  justOne: true,
});

schema.virtual("passport", {
  ref: "InvestorPassport",
  localField: "passport_id",
  foreignField: "_id",
  justOne: true,
});

export const OrganizationFundManager = mongoose.model<OrganizationFundManager>(
  "OrganizationFundManager",
  schema
);
