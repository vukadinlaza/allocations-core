import mongoose, { Document, ObjectId } from "mongoose";

export interface DealAgreement extends Document {
  title: string;
  deal_id: ObjectId;
  signed: boolean;
  type:
    | "services-agreement"
    | "advisory-agreement"
    | "ss-4"
    | "subscription-agreement"
    | "side-letter";
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

const schema = new mongoose.Schema<DealAgreement>(
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
    signed: {
      type: Boolean,
      default: false,
      required: true,
    },
    type: {
      type: String,
      enum: [
        "services-agreement",
        "advisory-agreement",
        "ss-4",
        "subscription-agreement",
        "side-letter",
      ],
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

schema.virtual("deal", {
  ref: "Deal",
  localField: "deal_id",
  foreignField: "_id",
  justOne: true,
});

export const DealAgreement = mongoose.model<DealAgreement>(
  "DealAgreement",
  schema,
  "deal_agreements"
);
