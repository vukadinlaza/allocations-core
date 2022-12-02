import { Document, Model, model, Schema, SchemaTypes, Types } from "mongoose";
import { Investment } from "./Investment";

export interface InvestmentLead extends Document {
  name: string;
  amount: number;
  email: string;
  deal_id: Types.ObjectId;
}

interface InvestmentLeadModel extends Model<InvestmentLead> {
  initialize: (
    leadId: string,
    body: Partial<Investment>
  ) => Promise<Investment>;
}

const InvestmentLeadSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  deal_id: {
    type: SchemaTypes.ObjectId,
    ref: "Deal",
    required: true,
  },
});

InvestmentLeadSchema.statics.initialize = async function (
  leadId: string,
  body: Partial<Investment>
) {
  const [investment] = await Promise.all([
    Investment.create(body),
    InvestmentLead.findOneAndDelete({ _id: leadId }),
  ]);
  return investment;
};

export const InvestmentLead = model<InvestmentLead, InvestmentLeadModel>(
  "InvestmentLead",
  InvestmentLeadSchema
);
