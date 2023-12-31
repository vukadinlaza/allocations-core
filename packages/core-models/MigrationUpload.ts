import mongoose, { Document, Schema } from "mongoose";

export interface MigrationUpload extends Document {
  notes: string | null;
  migration_id: mongoose.Types.ObjectId;
  s3_bucket: string;
  s3_key: string;
  title: string | null;
  type: string | null;
  updated_at: Date;
  created_at: Date;
}

const MigrationUploadSchema = new Schema(
  {
    notes: {
      type: String,
      default: null,
    },
    migration_id: { type: mongoose.SchemaTypes.ObjectId, required: true },
    s3_bucket: { type: String, required: true },
    s3_key: { type: String, required: true },
    title: { type: String, default: null },
    type: { type: String, default: null },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

MigrationUploadSchema.virtual("migration", {
  ref: "Migration",
  localField: "migration_id",
  foreignField: "_id",
  justOne: true,
});

export const MigrationUpload = mongoose.model<MigrationUpload>(
  "MigrationUpload",
  MigrationUploadSchema
);
