import { Deal } from "@allocations/core-models";

type LegacyDeal = Partial<Deal> & { legacy_deal: any };

const phaseArray: string[] = [
  "new",
  "build",
  "pre-onboarding",
  "onboarding",
  "closing",
  "closed",
];

export const transformLegacyDeal = (legacyDeal: any): LegacyDeal => {
  const isFund = legacyDeal.legacy_deal?.investmentType === "fund";
  if (typeof legacyDeal.carry_fee === "number") return legacyDeal;

  return {
    _id: legacyDeal._id,
    accept_crypto: false,
    allocations_accounting_provider: false,
    asset_type: "Startup",
    carry_fee: isFund
      ? Number(legacyDeal.legacy_deal.dealParams?.fundTotalCarry) / 100 || 0
      : Number(legacyDeal.legacy_deal.dealParams?.totalCarry) / 100 || 0,
    closing_date: Date.parse(legacyDeal.legacy_deal.date_closed)
      ? legacyDeal.legacy_deal.date_closed
      : "",
    created_at: legacyDeal.legacy_deal.created_at || "",
    custom_investment_agreement: false,
    deal_multiple: Number(legacyDeal.legacy_deal.dealParams?.dealMultiple) || 1,
    deal_term: legacyDeal.legacy_deal.dealParams?.estimatedTerm || "10 years",
    description: legacyDeal.legacy_deal.company_description || "",
    docspring_template_id:
      legacyDeal.legacy_deal.docSpringTemplateId || "tpl_RrmjKbpFRr7qhKY3dD",
    hubspot_deal_id: 0,
    ica_exemption: {
      exemption_type: "301",
      investor_type: "Accredited Investors",
    },
    international_company: false,
    international_investors: false,
    gp_entity: {
      gp_entity_name: legacyDeal.legacy_deal?.gp_entity_name || "",
      need_gp_entity: "false",
    },
    minimum_investment:
      legacyDeal.legacy_deal.dealParams?.minimumInvestment || 10000,
    management_fee: isFund
      ? Number(legacyDeal.legacy_deal.dealParams?.fundManagementFees) / 100 || 0
      : Number(legacyDeal.legacy_deal.dealParams?.managementFees) / 100 || 0,
    management_fee_frequency:
      legacyDeal.legacy_deal.dealParams?.managementFeeType || "",
    manager: {
      type: "individual",
      name: isFund
        ? legacyDeal.legacy_deal.dealParams?.fundGeneralPartner
        : legacyDeal.manager_name,
      email: "",
      title: "",
      entity_representative: "",
    },
    memo: legacyDeal.memo || "",
    name: legacyDeal.legacy_deal.company_name,
    offering_type: legacyDeal.legacy_deal.dealParams?.dealType || null,
    organization_id: legacyDeal.organization_id || null,
    organization_name: "",
    phase: phaseArray.includes(legacyDeal.legacy_deal.status)
      ? legacyDeal.legacy_deal.status
      : "closed",
    portfolio_company_name: legacyDeal.legacy_deal.company_name || "",
    portfolio_company_securities: "",
    reporting_adviser: "Sharding Advisers LLC",
    regular_distributions: false,
    sectors: [legacyDeal.legacy_deal.sector] || [],
    series_name: "",
    setup_cost:
      Number(legacyDeal.legacy_deal.dealParams?.estimatedSetupCostsDollar) || 0,
    side_letters: false,
    sign_deadline: legacyDeal.legacy_deal.dealParams?.signDeadline || "",
    slug: legacyDeal.slug || null,
    target_raise_goal: Number(legacyDeal.legacy_deal?.target) || 0,
    type: legacyDeal.legacy_deal?.investmentType || "spv",
    updated_at: new Date(),
    nd_virtual_account_number:
      legacyDeal.legacy_deal.virtual_account_number || null,
    wire_deadline: legacyDeal.legacy_deal.dealParams?.wireDeadline || null,
    user_email: "",
    legacy_deal: { ...legacyDeal.legacy_deal },
    __v: 1,
  };
};
export const updateServiceDeal = (serviceDeal: any): Deal => {
  return {
    ...serviceDeal,
    carry_fee: Number(serviceDeal.carry_fee.split("%")[0]) / 100,
    management_fee: Number(serviceDeal.management_fee.split("%")[0]) / 100,
  };
};
