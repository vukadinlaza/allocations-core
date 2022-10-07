import mongoose, { Document, Schema } from "mongoose";

export interface TaxInformation extends Document {
  passport_id: mongoose.Types.ObjectId;
  type: "W-9" | "W-9-E" | "W-8-BEN" | "W-8-BEN-E";
  tax_form_document_id: mongoose.Types.ObjectId;
  tax_form: W9TaxForm | W9ETaxForm | W8BENTaxForm | W8BENETaxForm;
  signature_packet?: {
    accepted_intent_to_sign: boolean;
    accepted_electronic_business: boolean;
    signer_ip_address: string;
    signer_user_id: string;
    signer_email: string;
    signature_date: Date;
  };
  updated_at: Date;
  created_at: Date;
}

export interface W9TaxForm extends Document {
  type: "W-9";
  address: string;
  city: string;
  state: string;
  postal_code: string;
  tax_id: string;
}

export interface W9ETaxForm extends Document {
  type: "W-9-E";
  name: string | null;
  smllc_name: string | null;
  ssn: string | null;
  company_type:
    | "C Corporation"
    | "S Corporation"
    | "Partnership"
    | "Single-Member LLC"
    | "Trust or Estate"
    | "Limited Liability Company"
    | "Other";
  smllc_owner_name: string;
  taxed_as: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  tax_id: string | null;
}

export interface W8BENTaxForm extends Document {
  type: "W-8-BEN";
  address: string;
  city: string;
  region: string;
  postal_code: string;
  residence_country: string;
  mailing_address: string;
  mailing_city: string;
  mailing_region: string;
  mailing_postal_code: string;
  mailing_country: string;
  date_of_birth: string;
  tax_id: string;
  foreign_tax_id: string;
}

export interface W8BENETaxForm extends Document {
  type: "W-8-BEN-E";
  disregarded_entity: string;
  chapter3_status:
    | "Corporation"
    | "Disregarded Entity"
    | "Partnership"
    | "Simple Trust"
    | "Grantor Trust"
    | "Complex Trust"
    | "Estate"
    | "Government"
    | "Central Bank of Issue"
    | "Tax-Exempt Organization"
    | "Private Foundation"
    | "International Organization";
  chapter4_status:
    | "Active NFFE"
    | "Passive NFFE"
    | "501(c) organization"
    | "International Organization"
    | "Exempt retirement plans"
    | "Entity wholly owned by exempt beneficial owners"
    | "Excepted nonfinancial group entity"
    | "Excepted nonfinancial start-up company"
    | "Excepted nonfinancial entity in liquidation or bankruptcy"
    | "Nonprofit organization"
    | "Publicly traded NFFE or NFFE affiliate of a publicly traded corporation"
    | "Excepted territory NFFE"
    | "Direct reporting NFFE"
    | "Sponsored direct reporting NFFE"
    | "Account that is not a financial account";
  address: string;
  city: string;
  region: string;
  postal_code: string;
  residence_country: string;
  mailing_address: string;
  mailing_city: string;
  mailing_region: string;
  mailing_postal_code: string;
  mailing_country: string;
  tax_id: string;
  foreign_tax_id: string;
}

const W9TaxFormSchema: Schema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  tax_id: {
    type: String,
    required: true,
  },
  postal_code: {
    type: String,
    required: true,
  },
});

const W9ETaxFormSchema = new mongoose.Schema({
  name: {
    type: String,
    default: null,
  },
  smllc_name: {
    type: String,
    default: null,
  },
  company_type: {
    type: String,
    enum: [
      "C Corporation",
      "S Corporation",
      "Partnership",
      "Single-Member LLC",
      "Trust or Estate",
      "Limited Liability Company",
      "Other",
    ],
    required: true,
  },
  smllc_owner_name: {
    type: String,
    required: function () {
      // @ts-ignore
      return this.company_type === "Single-Member LLC";
    },
  },
  ssn: {
    type: String,
    default: null,
    required: function (): boolean {
      // @ts-ignore
      return this.company_type === "Limited Liability Company";
    },
  },
  tax_id: {
    type: String,
    default: null,
    required: function (): boolean {
      // @ts-ignore
      return this.company_type === "Limited Liability Company";
    },
  },
  taxed_as: {
    type: String,
    enum: ["C Corporation", "S Corporation", "Partnership"],
    required: function () {
      // @ts-ignore
      return this.company_type === "Limited Liability Company";
    },
  },
});

const W8BENTaxFormSchema = new mongoose.Schema({
  date_of_birth: {
    type: String,
    required: true,
  },
  region: {
    type: String,
    required: true,
  },
  residence_country: {
    type: String,
    required: true,
  },
  mailing_address: {
    type: String,
    required: true,
  },
  mailing_city: {
    type: String,
    required: true,
  },
  mailing_region: {
    type: String,
    required: true,
  },
  mailing_postal_code: {
    type: String,
    required: true,
  },
  mailing_country: {
    type: String,
    required: true,
  },
  foreign_tax_id: {
    type: String,
    required: true,
  },
});

const W8BENETaxFormSchema = new mongoose.Schema({
  region: {
    type: String,
    required: true,
  },
  residence_country: {
    type: String,
    required: true,
  },
  mailing_address: {
    type: String,
    required: true,
  },
  mailing_city: {
    type: String,
    required: true,
  },
  mailing_region: {
    type: String,
    required: true,
  },
  mailing_postal_code: {
    type: String,
    required: true,
  },
  mailing_country: {
    type: String,
    required: true,
  },
  foreign_tax_id: {
    type: String,
    required: true,
  },
  disregarded_entity: {
    type: String,
  },
  chapter3_status: {
    type: String,
    enum: [
      "Corporation",
      "Disregarded Entity",
      "Partnership",
      "Simple Trust",
      "Grantor Trust",
      "Complex Trust",
      "Estate",
      "Government",
      "Central Bank of Issue",
      "Tax-Exempt Organization",
      "Private Foundation",
      "International Organization",
    ],
    required: true,
  },
  chapter4_status: {
    type: String,
    enum: [
      "Active NFFE",
      "Passive NFFE",
      "501(c) organization",
      "International Organization",
      "Exempt retirement plans",
      "Entity wholly owned by exempt beneficial owners",
      "Excepted nonfinancial group entity",
      "Excepted nonfinancial start-up company",
      "Excepted nonfinancial entity in liquidation or bankruptcy",
      "Nonprofit organization",
      "Publicly traded NFFE or NFFE affiliate of a publicly traded corporation",
      "Excepted territory NFFE",
      "Direct reporting NFFE",
      "Sponsored direct reporting NFFE",
      "Account that is not a financial account",
    ],
    required: true,
  },
});

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

export const TaxInformationSchema: Schema = new mongoose.Schema(
  {
    passport_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "InvestorPassport",
      required: true,
    },
    type: {
      type: String,
      enum: ["W-9", "W-9-E", "W-8-BEN", "W-8-BEN-E"],
      required: true,
    },
    tax_form_document_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "PassportAsset",
    },
    tax_form: new mongoose.Schema({}, { discriminatorKey: "type" }),
    signature_packet: {
      type: signaturePacketSchema,
      select: false,
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

export const W9TaxForm = TaxInformationSchema.path<Schema.Types.Subdocument>(
  "tax_form"
).discriminator("W9TaxForm", W9TaxFormSchema, "W-9");

export const W9ETaxForm = TaxInformationSchema.path<Schema.Types.Subdocument>(
  "tax_form"
).discriminator("W9ETaxForm", W9ETaxFormSchema, "W-9-E");

export const W8BENTaxForm = TaxInformationSchema.path<Schema.Types.Subdocument>(
  "tax_form"
).discriminator("W8BENTaxForm", W8BENTaxFormSchema, "W-8-BEN");

export const W8BENETaxForm =
  TaxInformationSchema.path<Schema.Types.Subdocument>("tax_form").discriminator(
    "W8BENETaxForm",
    W8BENETaxFormSchema,
    "W-8-BEN-E"
  );

export const TaxInformation = mongoose.model<TaxInformation>(
  "TaxInformation",
  TaxInformationSchema
);
