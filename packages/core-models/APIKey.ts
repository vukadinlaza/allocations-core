import mongoose, { Document, ObjectId } from "mongoose";

export interface APIKey extends Document {
  description?: string;
  api_key: string;
  key_id: string;
  organization_id: ObjectId;
  test: boolean;
}

const schema = new mongoose.Schema<APIKey>(
  {
    description: {
      type: String,
    },
    api_key: {
      type: String,
      required: true,
    },
    key_id: {
      type: String,
      required: true,
      select: false,
    },
    organization_id: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
    },
    test: {
      type: Boolean,
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

schema.index({ api_key: 1 });

export const APIKey = mongoose.model<APIKey>("APIKey", schema, "api_keys");
