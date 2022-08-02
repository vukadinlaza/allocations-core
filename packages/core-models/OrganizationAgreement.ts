import mongoose, { Document, ObjectId } from "mongoose";

export interface OrganizationAgreement extends Document {
  title: string;
  organization_id: ObjectId;
  signed: boolean;
  type: "services-agreement" | "memorandum-of-understanding";
  md5: string;
  s3_bucket?: string;
  s3_key?: string;
  signature_packet?: {
    accepted_intent_to_sign: boolean;
    accepted_electronic_business: boolean;
    signer_ip_address: string;
    signer_user_id: string;
    signer_email: string;
    signature_date: Date;
  };
}

const signaturePacketSchema = new mongoose.Schema({
  accepted_intent_to_sign: {
    type: Boolean,
    required: true,
  },
  accepted_electronic_business: {
    type: Boolean,
    required: true,
  },
  signer_ip_address: {
    type: String,
    required: true,
  },
  signer_user_id: {
    type: String,
    required: true,
  },
  signer_email: {
    type: String,
    required: true,
  },
  signature_date: {
    type: Date,
    required: true,
  },
});

const schema = new mongoose.Schema<OrganizationAgreement>(
  {
    title: {
      type: String,
      required: true,
    },
    organization_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Organization",
      required: true,
    },
    signed: {
      type: Boolean,
      default: false,
      required: true,
    },
    type: {
      type: String,
      enum: ["services-agreement", "memorandum-of-understanding"],
      required: true,
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
    signature_packet: {
      type: signaturePacketSchema,
      select: false,
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

export const OrganizationAgreement = mongoose.model<OrganizationAgreement>(
  "OrganizationAgreement",
  schema
);
