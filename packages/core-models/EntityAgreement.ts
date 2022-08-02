import mongoose, { Document, ObjectId } from "mongoose";

export interface EntityAgreement extends Document {
  title: string;
  entity_id: ObjectId;
  signed: boolean;
  type: "master-series-llc-agreement";
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

const schema = new mongoose.Schema<EntityAgreement>(
  {
    title: {
      type: String,
      required: true,
    },
    entity_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Entity",
      required: true,
    },
    signed: {
      type: Boolean,
      default: false,
      required: true,
    },
    type: {
      type: String,
      enum: ["master-series-llc-agreement"],
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

schema.virtual("entity", {
  ref: "Entity",
  localField: "entity_id",
  foreignField: "_id",
  justOne: true,
});

export const EntityAgreement = mongoose.model<EntityAgreement>(
  "EntityAgreement",
  schema
);
