import mongoose, { Document, ObjectId } from "mongoose";

export interface OrganizationModerator extends Document {
  user_id: ObjectId;
  organization_id: ObjectId;
  role: string;
}

const schema = new mongoose.Schema<OrganizationModerator>(
  {
    user_id: {
      type: mongoose.SchemaTypes.ObjectId,
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

schema.virtual("fund_manager", {
  ref: "OrganizationFundManager",
  localField: "organization_id",
  foreignField: "organization_id",
});

export const OrganizationModerator = mongoose.model<OrganizationModerator>(
  "OrganizationModerator",
  schema
);
