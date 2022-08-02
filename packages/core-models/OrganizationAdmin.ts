import mongoose, { Document, Model, ObjectId } from "mongoose";

export interface OrganizationAdmin extends Document {
  user_email: string;
  user_id: ObjectId;
  organization_id: ObjectId;
  super_admin?: boolean;
}

interface OrganizationAdminModel extends Model<OrganizationAdmin> {}

const schema = new mongoose.Schema<OrganizationAdmin, OrganizationAdminModel>(
  {
    user_email: {
      type: String,
      required: true,
    },
    user_id: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
    },
    organization_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Organization",
      required: true,
    },
    super_admin: Boolean,
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
  }
);

export const OrganizationAdmin = mongoose.model<
  OrganizationAdmin,
  OrganizationAdminModel
>("OrganizationAdmin", schema);
