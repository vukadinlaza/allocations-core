import mongoose, { Document, ObjectId } from "mongoose";

export interface InvestmentAgreement extends Document {
  title: string;
  investment_id: ObjectId;
  signed: boolean;
  type: "subscription-agreement" | "side-letter";
  md5: string;
  s3_bucket?: string;
  s3_key?: string;
  status?: 'archived' | 'active';
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

const schema = new mongoose.Schema<InvestmentAgreement>(
  {
    title: {
      type: String,
      required: true,
    },
    investment_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Investment",
      required: true,
    },
    signed: {
      type: Boolean,
      default: false,
      required: true,
    },
    type: {
      type: String,
      enum: ["subscription-agreement", "side-letter"],
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
    status: {
      type: String,
      enum: ['archived', 'active'],
      required: false,
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
        delete ret.s3_bucket;
        delete ret.s3_key;
        delete ret.__v;
        return ret;
      },
    },
  }
);

schema.virtual("investment", {
  ref: "SPVInvestment",
  localField: "investment_id",
  foreignField: "_id",
  justOne: true,
});

export const InvestmentAgreement = mongoose.model<InvestmentAgreement>(
  "InvestmentAgreement",
  schema,
  "investment_agreements"
);
