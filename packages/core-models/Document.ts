import mongoose, { Model, Document as MongooseDocument } from "mongoose";

export interface Document extends MongooseDocument {
  deal_id?: mongoose.Types.ObjectId;
  organization_id?: mongoose.Types.ObjectId;
  task_id?: mongoose.Types.ObjectId;
  user_id?: mongoose.Types.ObjectId;
  title: string;
  bucket: string;
  path: string;
  content_type: string;
  complete: boolean;
  type: "upload" | "fm-document";
  uploader_email: String;
  metadata: Map<string, string | boolean | number>;
  createdAt: string;
  updatedAt: string;
}

interface DocumentModel extends Model<Document> {}

const schema = new mongoose.Schema<Document, DocumentModel>(
  {
    deal_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Deal",
    },
    organization_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Organization",
    },
    task_id: mongoose.SchemaTypes.ObjectId,
    user_id: mongoose.SchemaTypes.ObjectId,
    title: {
      type: String,
      required: true,
    },
    bucket: {
      type: String,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    content_type: {
      type: String,
      required: true,
    },
    complete: {
      type: Boolean,
      required: true,
      default: false,
    },
    type: {
      type: String,
      enum: ["upload", "fm-document"],
      required: true,
    },
    uploader_email: String,
    metadata: Map,
  },
  { timestamps: true }
);

export const Document = mongoose.model<Document, DocumentModel>(
  "Document",
  schema
);
