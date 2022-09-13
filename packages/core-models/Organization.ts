import mongoose, { Document } from "mongoose";

export interface Organization extends Document {
  name: string;
  phase: string;
  slug: string;
  desired_entity_name?: string;
  master_series: string;
  high_volume_partner: boolean;
  committed_number_of_deals: number;
  mou_signed: boolean;
  metadata: Map<string, string | number | boolean>;
}

const schema = new mongoose.Schema<Organization>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    phase: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    master_series: String,
    high_volume_partner: {
      type: Boolean,
      required: true,
      default: false,
    },
    desired_entity_name: {
      type: String,
    },
    mou_signed: {
      type: Boolean,
      required: true,
      default: false,
    },
    committed_number_of_deals: {
      type: Number,
      required: true,
    },
    metadata: {
      type: Map,
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

schema.pre("validate", function (next) {
  this.slug = encodeURIComponent(this.name.split(" ").join("-").toLowerCase());
  next();
});

schema.virtual("admins", {
  ref: "OrganizationAdmin",
  localField: "_id",
  foreignField: "organization_id",
});

schema.virtual("fund_managers", {
  ref: "OrganizationFundManager",
  localField: "_id",
  foreignField: "organization_id",
});

schema.virtual("moderators", {
  ref: "OrganizationModerator",
  localField: "_id",
  foreignField: "organization_id",
});

schema.virtual("entities", {
  ref: "Entity",
  localField: "_id",
  foreignField: "organization_id",
});

export const Organization = mongoose.model<Organization>(
  "Organization",
  schema
);
