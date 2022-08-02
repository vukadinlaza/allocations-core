import mongoose, { Document, Schema } from "mongoose";

export interface PassportUser extends Document {
  passport_id: mongoose.Types.ObjectId;
  user_id: string;
  role: string;
  updated_at: Date;
  created_at: Date;
}

const PassportUserSchema: Schema = new mongoose.Schema(
  {
    passport_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "InvestorPassport",
      required: true,
    },
    user_id: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
    toJSON: {
      virtuals: true,
      transform: (_, ret) => {
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const PassportUser = mongoose.model<PassportUser>(
  "PassportUser",
  PassportUserSchema
);
