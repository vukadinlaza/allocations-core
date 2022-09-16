import mongoose, { Document, Model } from "mongoose";
import fetch from "node-fetch";
import { DealPhase } from "./DealPhase";

export interface Deal extends Document {
  organization_id: mongoose.Types.ObjectId;
  organization_name: string;
  user_id: mongoose.Types.ObjectId;
  user_email: string;
  slug: string;
  name: string;
  accept_crypto: boolean;
  allocations_accounting_provider: boolean;
  angels_deal: boolean;
  asset_type: string;
  carry_fee: number;
  closing_date: Date;
  custom_investment_agreement: boolean;
  deal_multiple: number;
  deal_term: string;
  description: string;
  distribution_frequency: string;
  docspring_template_id: string;
  template_type: string;
  fee_payment_method?: string;
  gp_entity: {
    gp_entity_name: string;
    need_gp_entity: string;
  };
  hubspot_deal_id: number;
  ica_exemption: {
    exemption_type: string;
    investor_type: string;
  };
  instant_spv_disclaimer?: boolean;
  international_company: boolean;
  international_investors: boolean;
  investor_passport_id: mongoose.Types.ObjectId;
  management_fee: number;
  management_fee_frequency: string;
  manager: {
    type: string;
    name: string;
    entity_representative?: string;
    email: string;
    title?: string;
  };
  memo: string;
  minimum_investment: number;
  nd_virtual_account_number: string;
  number_of_investments: number;
  offering_type: string;
  phase: string;
  portfolio_company_name: string;
  portfolio_company_securities: string;
  regular_distributions: boolean;
  reporting_adviser: string;
  reporting_adviser_fee: number;
  sectors: [string];
  series_name?: string;
  master_entity_id?: string;
  setup_cost: number;
  side_letters: boolean;
  sign_deadline: Date;
  target_raise_goal: number;
  type: "spv" | "fund" | "acquisition" | "migration";
  type_of_investors?: string;
  wire_deadline: Date;
  created_at: Date;
  updated_at: Date;
  legacy_deal: Partial<Deal>;
  subscription_agreement: {
    docspring_base_template_id: string;
    docspring_base_template_name: string;
    docspring_presign_template_id: string;
    investor_docspring_template_id: string;
    fm_signing_data_req_id: string;
    field_injection_strategy: string;
    fm_template_approved: boolean;
    fm_template_approved_by: string;
    investor_template_approved: boolean;
    investor_template_approved_by: string;
  };
  metadata: Map<string, any>;
}

interface DealModel extends Model<Deal> {
  initialize(id: mongoose.Types.ObjectId, token: string): void;
  createWithPhases(
    options: Deal,
    new_hvp: boolean
  ): { deal: Deal; phases: DealPhase[] };
}

const schema = new mongoose.Schema<Deal, DealModel>(
  {
    organization_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Organization",
      required: true,
    },
    organization_name: { type: String, required: true },
    slug: String,
    name: { type: String, required: true },
    user_id: {
      type: mongoose.SchemaTypes.ObjectId,
      required: false,
    },
    user_email: { type: String, required: true },
    accept_crypto: Boolean,
    angels_deal: Boolean,
    allocations_accounting_provider: Boolean,
    asset_type: {
      type: String,
      enum: [
        "Startup",
        "Crypto",
        "Secondary",
        "Real Estate",
        "SPV into an SPV",
        "SPV into a Fund",
        "Management Company",
        "Custom",
        "Instant",
      ],
    },
    carry_fee: Number,
    closing_date: Date,
    custom_investment_agreement: Boolean,
    deal_multiple: Number,
    deal_term: {
      type: String,
      required: true,
      default: "10 years",
    },
    description: String,
    distribution_frequency: {
      type: String,
      enum: ["Monthly", "Quarterly", "Bi-Annually", "Annually"],
    },
    docspring_template_id: String,
    template_type: String,
    fee_payment_method: {
      type: String,
      enum: [
        "Directly from the raise",
        "Invoice Fund Manager",
        "Deduct directly from the management fee",
        "Pay with Crypto",
      ],
    },
    gp_entity: {
      gp_entity_name: String,
      need_gp_entity: String,
    },
    hubspot_deal_id: Number,
    ica_exemption: {
      exemption_type: String,
      investor_type: {
        type: String,
        enum: ["Accredited Investors", "Qualified Purchasers"],
      },
    },
    instant_spv_disclaimer: Boolean,
    international_company: Boolean,
    international_investors: Boolean,
    investor_passport_id: {
      type: mongoose.SchemaTypes.ObjectId,
      required: false,
    },
    manager: {
      type: {
        type: String,
        enum: ["entity", "individual"],
      },
      entity_representative: String,
      name: String,
      email: String,
      title: String,
    },
    management_fee: Number,
    management_fee_frequency: String,
    master_entity_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Entity",
    },
    memo: String,
    minimum_investment: {
      type: Number,
      default: 10000,
    },
    nd_virtual_account_number: String,
    number_of_investments: Number,
    offering_type: { type: String, enum: ["506b", "506c"] },
    phase: {
      type: String,
      enum: [
        "new",
        "build",
        "pre-onboarding",
        "onboarding",
        "closing",
        "closed",
      ],
      required: true,
    },
    portfolio_company_name: String,
    portfolio_company_securities: String,
    regular_distributions: Boolean,
    reporting_adviser: {
      type: String,
      required: true,
      default: "Sharding Advisers LLC",
    },
    reporting_adviser_fee: {
      type: Number,
      default: 0,
    },
    sectors: [String],
    series_name: String,
    setup_cost: Number,
    side_letters: Boolean,
    sign_deadline: Date,
    target_raise_goal: {
      type: Number,
      default: 0,
    },
    type: {
      type: String,
      enum: ["spv", "fund", "acquisition", "migration"],
    },
    type_of_investors: {
      type: String,
      enum: [
        "Accredited Investors (3(c)(1))",
        "Qualified Purchasers (3(c)(7))",
      ],
    },
    wire_deadline: Date,
    subscription_agreement: {
      docspring_base_template_id: String,
      docspring_base_template_name: String,
      docspring_presign_template_id: String,
      investor_docspring_template_id: String,
      fm_signing_data_req_id: String,
      field_injection_strategy: String,
      fm_template_approved: Boolean,
      fm_template_approved_by: String,
      investor_template_approved: Boolean,
      investor_template_approved_by: String,
    },
    metadata: Map,
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
  }
);

schema.virtual("phases", {
  ref: "DealPhase",
  localField: "_id",
  foreignField: "deal_id",
  justOne: false,
});

schema.index({ organization_id: 1, name: 1 }, { unique: true });

schema.statics.initialize = async function (
  id: mongoose.Types.ObjectId,
  token: string
) {
  const res = await fetch(`${process.env.SERVICE_URL!}/initialize`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-TOKEN": token,
    },
    body: JSON.stringify({ id }),
  });

  if (!res.ok) throw new Error(`Unable to initialize deal: ${id}`);

  return res.json();
};

schema.statics.createWithPhases = async function (
  options: Deal,
  new_hvp: boolean
) {
  const deal = await this.create(options);

  const phases = [
    await DealPhase.createBuild(deal),
    await DealPhase.createPostBuild(deal),
    await DealPhase.createPreOnboarding(deal, new_hvp),
    await DealPhase.createOnboarding(deal),
    await DealPhase.createClosing(deal),
    await DealPhase.createPostClosing(deal._id),
  ];

  return { deal, phases };
};

schema.statics.findByIdWithPhases = async function (id) {
  const deal = await this.findById(id).populate("phases");

  return deal;
};

schema.virtual("organization", {
  ref: "Organization",
  localField: "organization_id",
  foreignField: "_id",
  justOne: true,
});

export const Deal = mongoose.model<Deal, DealModel>("Deal", schema);
