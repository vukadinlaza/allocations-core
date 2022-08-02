import mongoose, { Model, Document as MongooseDocument } from "mongoose";

export interface InvestmentDocument extends MongooseDocument {
  investment_id: mongoose.Types.ObjectId;
  title: string;
  bucket: string;
  path: string;
  content_type: string;
  complete: boolean;
  created_by: mongoose.Types.ObjectId;
}

interface InvestmentDocumentModel extends Model<InvestmentDocument> {}

const schema = new mongoose.Schema<InvestmentDocument, InvestmentDocumentModel>(
  {
    investment_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Investment",
    },
    title: {
      type: String,
      required: true,
    },
    bucket: {
      type: String,
      required: function (this: InvestmentDocument) {
        return typeof this.bucket === "string" ? false : true;
      },
    },
    path: {
      type: String,
      required: function (this: InvestmentDocument) {
        return typeof this.path === "string" ? false : true;
      },
    },
    content_type: {
      type: String,
      required: function (this: InvestmentDocument) {
        return typeof this.content_type === "string" ? false : true;
      },
    },
    complete: {
      type: Boolean,
      required: true,
      default: false,
    },
    created_by: mongoose.SchemaTypes.ObjectId,
  },
  { timestamps: true }
);

export const InvestmentDocument = mongoose.model<
  InvestmentDocument,
  InvestmentDocumentModel
>("InvestmentDocument", schema);
