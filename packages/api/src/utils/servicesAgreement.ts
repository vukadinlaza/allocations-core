/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { Deal, Document, Task } from "@allocations/core-models";
import { Entity } from "@allocations/core-models";
import {
  createSubmissionAndGeneratePDF,
  getDocspringEnvironment,
} from "./docspring";
import { formatDate } from "./helpers";

const SERVICES_AGREEMENT_TEMPLATE_IDS: {
  [key: string]: any;
} = {
  spv: process.env.SPV_TEMPLATE_ID!,
  fund: {
    "30_or_more": process.env.FUND_TEMPLATE_OVER_30_ID!,
    less_than_30: process.env.FUND_TEMPLATE_UNDER_30_ID!,
  },
  acquisition: process.env.ACQUISITIONS_TEMPLATE_ID!,
};

const SERVICES_AGREEMENT_TEMPLATE_PREVIEW_IDS: {
  [key: string]: any;
} = {
  spv: process.env.SPV_TEMPLATE_PREVIEW_ID!,
  fund: {
    "30_or_more": process.env.FUND_TEMPLATE_OVER_30_PREVIEW_ID!,
    less_than_30: process.env.FUND_TEMPLATE_UNDER_30_PREVIEW_ID!,
  },

  acquisition: process.env.ACQUISITIONS_TEMPLATE_PREVIEW_ID!,
};

const findTemplate = ({
  type,
  investments,
  preview,
}: {
  type: string;
  investments?: number;
  preview?: boolean;
}): string => {
  let AGREEMENT_MAP: {
    [key: string]: any;
  } = {};

  if (preview) AGREEMENT_MAP = SERVICES_AGREEMENT_TEMPLATE_PREVIEW_IDS;
  else AGREEMENT_MAP = SERVICES_AGREEMENT_TEMPLATE_IDS;

  if (type === "fund" && investments) {
    return investments >= 30
      ? AGREEMENT_MAP.fund["30_or_more"]
      : AGREEMENT_MAP.fund["less_than_30"];
  }

  return AGREEMENT_MAP[type];
};

const aquisitionPricingMap: { [key: string]: string } = {
  Monthly: "$350 per distribution",
  Quarterly: "$500 per distribution",
  "Bi-Annually": "$750 per distribution",
  Annually: "$1500 per distribution",
};

const toDollarString = (amount: number) => `$${amount}`;
const toDollarStringWithCents = (amount: number) => `$${amount}.00`;

const toPercent = (amount: number) => {
  const wholeNum = amount * 100;
  return `${wholeNum}%`;
};

const convertProductType = (type: string, assetType: string): string => {
  const assetTypeMap: { [key: string]: { [key: string]: string } } = {
    spv: {
      Startup: "Single Asset SPV",
      Crypto: `${assetType} SPV`,
      "Real Estate": `${assetType} SPV`,
      Custom: `${assetType} SPV`,
      Secondary: `${assetType} SPV`,
      "Management Company": `SPV into a ${assetType}`,
      Micro: "Micro SPV",
      default: assetType,
    },
    fund: {
      Startup: "Fund",
      Crypto: "Fund",
      "Real Estate": "Fund",
    },
  };

  return assetTypeMap[type][assetType] || assetTypeMap["spv"].default;
};

const convertSpecialTerms = (deal: Deal) => {
  const specialTerms: {
    quantity: number | string;
    fee: number | string;
    total: number | string;
  }[] = deal.metadata?.get("special_terms") || [
    { term: "Bluesky Fees", fee: "TBD", quantity: "TBD", total: "TBD" },
    {
      term: "Over 35 Investors",
      fee: "$100 each",
      quantity: "TBD",
      total: "TBD",
    },
  ];

  return specialTerms.map((term) => ({
    ...term,
    quantity: term.quantity.toString(),
    fee: typeof term.fee === "number" ? toDollarString(term.fee) : term.fee,
    total:
      typeof term.total === "number" ? toDollarString(term.total) : term.total,
  }));
};

const calculateProductTypeFee = (deal: Deal) => {
  return deal.setup_cost;
};

const calculateGPSetupFee = (deal: Deal) => {
  // converting to boolean?
  return deal.gp_entity.need_gp_entity === "true" ? 1000 : 0;
};

const calculateOfferingTypeFee = (deal: Deal) => {
  return deal.offering_type === "506c" &&
    deal.type === "fund" &&
    deal.number_of_investments < 30
    ? 5000
    : 0;
};

const calculateAdvisorFee = (deal: Deal) => {
  return deal.reporting_adviser_fee || 0;
};

const calculateSpecialTerms = (deal: Deal) => {
  const specialTerms: { total: number | string }[] = deal.metadata?.get(
    "special_terms"
  ) || [
    { term: "Bluesky Fees", fee: "TBD", quantity: "TBD", total: "TBD" },
    {
      term: "Over 35 Investors",
      fee: "$100 each",
      quantity: "TBD",
      total: "TBD",
    },
  ];
  return specialTerms
    .map(({ total, ...rest }) => {
      if (typeof total === "string" && total.charAt(0) === "$") {
        return { ...rest, total: parseInt(total.slice(1)) };
      }
      return { ...rest, total };
    })
    .filter(({ total }) => typeof total === "number")
    .reduce((acc, { total }) => acc + (total as number), 0);
};

const calculateGrandTotal = (deal: Deal) => {
  return (
    calculateProductTypeFee(deal) +
    calculateAdvisorFee(deal) +
    calculateGPSetupFee(deal) +
    calculateSpecialTerms(deal)
  );
};

// taken from stackoverflow https://stackoverflow.com/questions/12409299/how-to-get-current-formatted-date-dd-mm-yyyy-in-javascript-and-append-it-to-an-i
const todaysDate = (): string => {
  const today = new Date();
  const yyyy = today.getFullYear();
  let mm: string | number = today.getMonth() + 1; // Months start at 0!
  let dd: string | number = today.getDate();

  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;

  return `${mm}/${dd}/${yyyy}`;
};

export const createServicesAgreement = async (
  deal: Deal,
  task: Task,
  preview?: boolean
) => {
  const templateId = findTemplate({
    type: deal.type,
    preview,
    investments: deal?.number_of_investments,
  });

  const over30Investments = deal?.number_of_investments >= 30;

  const entity = await Entity.findById(deal.master_entity_id);

  const spvData = {
    signature:
      deal.manager.type === "entity"
        ? deal.manager.entity_representative
        : deal.manager.name,
    signature_company:
      deal.manager.type === "entity"
        ? deal.manager.entity_representative
        : undefined,
    manager_name: deal.manager.name,
    client_name:
      deal.manager.type === "entity"
        ? deal.manager.entity_representative
        : deal.manager.name,
    client_name_company:
      deal.manager.type === "entity"
        ? deal.manager.entity_representative
        : undefined,
    manager_email: deal.manager.email,
    manager_title: deal.manager.title,
    master_series: entity
      ? `${entity?.name} ${entity?.structure}`
      : "Allocations Funds LLC",
    minimum_investment: `$${deal.minimum_investment}`,
    custom_reporting_adviser: deal.reporting_adviser,
    closing_date: formatDate(deal.closing_date),
    offering_type: deal.offering_type,
    deal_term: deal.deal_term,
    portfolio_company_name: deal.portfolio_company_name,
    fees: `Management Fee ${toPercent(deal.management_fee)} (${
      deal.management_fee_frequency
    }) / Carry Fee ${toPercent(deal.carry_fee)}`,
    product_type: convertProductType("spv", deal.asset_type),
    product_type_fee: toDollarString(calculateProductTypeFee(deal)),
    product_total: toDollarString(calculateProductTypeFee(deal)),
    advisor_fee: toDollarString(calculateAdvisorFee(deal)),
    advisor_count: deal.reporting_adviser === "Sharding Advisers LLC" ? 1 : 0,
    advisor_fee_total: toDollarString(calculateAdvisorFee(deal)),
    offering_type_fee:
      deal.offering_type === "506c" ? "$70 Per Investor/LP" : "included ($0)",
    offering_type_total:
      deal.offering_type === "506c" ? "TBD" : "included ($0)",
    grand_total: toDollarString(calculateGrandTotal(deal)),
    date: todaysDate(),
    entity_name: deal.manager.type === "entity" ? deal.manager.name : undefined,
    special_terms: convertSpecialTerms(deal),
  };

  const fundData = {
    manager_name: deal.manager.name,
    client_name:
      deal.manager.type === "entity"
        ? deal.manager.entity_representative
        : deal.manager.name,
    manager_name_company:
      deal.manager.type === "entity"
        ? deal.manager.entity_representative
        : undefined,
    manager_email: deal.manager.email,
    manager_title: deal.manager.title,
    name: entity
      ? `${entity?.name} ${entity?.structure}`
      : "Allocations Funds LLC",
    representative:
      deal.manager.type === "entity"
        ? deal.manager.entity_representative
        : deal.manager.name,
    custom_reporting_adviser: deal.reporting_adviser,
    closing_date: formatDate(deal.closing_date),
    offering_type: deal.offering_type,
    offering_type_fee: "included ($0)",
    advisor_fee: toDollarStringWithCents(calculateAdvisorFee(deal)),
    advisor_count: deal.reporting_adviser === "Sharding Advisers LLC" ? 1 : 0,
    gp_setup_cost: "$1,000.00",
    gp_setup_fee: toDollarStringWithCents(calculateGPSetupFee(deal)),
    product_fee: `${toDollarStringWithCents(deal.setup_cost)} ${
      over30Investments ? "(annually)" : ""
    }`,
    product_fee_total: toDollarStringWithCents(deal.setup_cost),
    gp_count: deal.gp_entity.need_gp_entity === "true" ? 1 : 0,
    deal_term: deal.deal_term,
    fees: `Management Fee ${toPercent(deal.management_fee)} (${
      deal.management_fee_frequency
    }) / Carry Fee ${toPercent(deal.carry_fee)}`,
    grand_total: toDollarStringWithCents(calculateGrandTotal(deal)),
    signature:
      deal.manager.type === "entity"
        ? deal.manager.entity_representative
        : deal.manager.name,
    signature_company:
      deal.manager.type === "entity"
        ? deal.manager.entity_representative
        : undefined,
    date: todaysDate(),
    entity_name: deal.manager.type === "entity" ? deal.manager.name : undefined,
  };

  const acquisitionData = {
    signature:
      deal.manager.type === "entity"
        ? deal.manager.entity_representative
        : deal.manager.name,
    signature_company:
      deal.manager.type === "entity"
        ? deal.manager.entity_representative
        : undefined,
    manager_name: deal.manager.name,
    client_name:
      deal.manager.type === "entity"
        ? deal.manager.entity_representative
        : deal.manager.name,
    client_name_company:
      deal.manager.type === "entity"
        ? deal.manager.entity_representative
        : undefined,
    manager_email: deal.manager.email,
    manager_title: deal.manager.title,
    master_series: entity
      ? `${entity?.name} ${entity?.structure}`
      : "Allocations Funds LLC",
    minimum_investment: `$${deal.minimum_investment}`,
    custom_reporting_adviser: deal.reporting_adviser,
    closing_date: formatDate(deal.closing_date),
    offering_type: deal.offering_type,
    deal_term: deal.deal_term,
    distribution_frequency: deal.distribution_frequency || "On Exit",
    allocations_accounting_provider: deal.allocations_accounting_provider
      ? "Yes"
      : "No",
    portfolio_company_name: deal.portfolio_company_name,
    fees: `Management Fee ${toPercent(deal.management_fee)} (${
      deal.management_fee_frequency
    }) / Carry Fee ${toPercent(deal.carry_fee)}`,
    advisor_fee: toDollarString(calculateAdvisorFee(deal)),
    advisor_fee_total: toDollarString(calculateAdvisorFee(deal)),
    offering_type_fee: calculateOfferingTypeFee(deal)
      ? toDollarStringWithCents(calculateOfferingTypeFee(deal))
      : deal.offering_type === "506c"
      ? "$70 Per Investor/LP"
      : "included ($0)",
    offering_type_total:
      deal.offering_type === "506c" ? "TBD" : "included ($0)",
    regular_distributions: deal.regular_distributions
      ? deal.distribution_frequency
      : "On Exit",
    distribution_fee: deal.regular_distributions
      ? aquisitionPricingMap[deal.distribution_frequency]
      : "Included ($)",
    distribution_fee_total: deal.regular_distributions ? "TBD" : "Included ($)",
    grand_total: toDollarString(calculateGrandTotal(deal)),
    Date: todaysDate(),
    entity_name: deal.manager.type === "entity" ? deal.manager.name : undefined,
  };

  const dataMap: any = {
    spv: spvData,
    fund: fundData,
    acquisition: acquisitionData,
  };

  const servicesAgreementData = dataMap[deal.type];

  const { id, permanent_download_url, download_url } =
    await createSubmissionAndGeneratePDF({
      templateId,
      data: servicesAgreementData,
      preview,
      metadata: {
        related_entity_type: "deal",
        document_type: "services-agreement",
        deal_id: deal._id,
      },
    });

  if (!preview) {
    await Document.create({
      status: "pending",
      deal_id: deal._id,
      task_id: task._id,
      title: "Services Agreement",
      bucket: process.env.DOCUMENTS_BUCKET,
      path: `deal/services-agreement/${getDocspringEnvironment()}/${
        deal._id
      }/${id}`,
      content_type: "application/pdf",
      uploader_email: deal.manager.email,
      complete: false,
      type: "fm-document",
      metadata: {
        permanent_download_url,
      },
    });
  }

  return {
    download_url,
    task,
  };
};

export const createOrderForm = async (
  deal: Deal,
  task: Task,
  preview?: boolean
) => {
  const isMicro =
    deal.type === "spv" &&
    deal.asset_type === "Startup" &&
    deal.target_raise_goal <= 99999 &&
    !deal.side_letters;

  const templateId: string = preview
    ? process.env.ORDER_FORM_PREVIEW_TEMPLATE_ID!
    : process.env.ORDER_FORM_TEMPLATE_ID!;

  const entity = await Entity.findById(deal.master_entity_id);

  const data = {
    signature:
      deal.manager.type === "entity"
        ? deal.manager.entity_representative
        : deal.manager.name,
    manager_name: deal.manager.name,
    client_name:
      deal.manager.type === "entity"
        ? deal.manager.entity_representative
        : deal.manager.name,
    manager_email: deal.manager.email,
    master_series: entity
      ? `${entity?.name} ${entity?.structure}`
      : "Allocations Funds LLC",
    minimum_investment: `$${deal.minimum_investment}`,
    custom_reporting_adviser: deal.reporting_adviser,
    closing_date: formatDate(deal.closing_date),
    offering_type: deal.offering_type,
    deal_term: deal.deal_term,
    portfolio_company_name: deal.portfolio_company_name,
    fees: `Management Fee ${toPercent(deal.management_fee)} (${
      deal.management_fee_frequency
    }) / Carry Fee ${toPercent(deal.carry_fee)}`,
    product_type: convertProductType(deal.type, deal.asset_type),
    product_type_fee: toDollarString(calculateProductTypeFee(deal)),
    product_total: toDollarString(calculateProductTypeFee(deal)),
    advisor_fee: isMicro
      ? `$1,000 per asset`
      : toDollarString(calculateAdvisorFee(deal)),
    advisor_count: deal.reporting_adviser === "Sharding Advisers LLC" ? 1 : 0,
    advisor_fee_total: isMicro
      ? "TBD"
      : toDollarString(calculateAdvisorFee(deal)),
    offering_type_fee: calculateOfferingTypeFee(deal)
      ? "included ($0)"
      : deal.offering_type === "506c"
      ? "$70 Per Investor/LP"
      : "included ($0)",
    offering_type_total: calculateOfferingTypeFee(deal)
      ? "included ($0)"
      : deal.offering_type === "506c"
      ? "TBD"
      : "included ($0)",
    grand_total: toDollarString(calculateGrandTotal(deal)),
    date: todaysDate(),
    entity_name: deal.manager.type === "entity" ? deal.manager.name : undefined,
    special_terms: convertSpecialTerms(deal),
    special_notes: deal.metadata?.get("special_notes") || "",
    master_entity_structure:
      deal.type === "spv"
        ? "Master Series Limited Liability Company Name"
        : "Master Series Limited Partner Name",
  };

  const { id, permanent_download_url, download_url } =
    await createSubmissionAndGeneratePDF({
      templateId,
      data,
      preview,
      metadata: {
        related_entity_type: "deal",
        document_type: "order-form",
        deal_id: deal._id,
      },
    });

  if (!preview) {
    await Document.create({
      status: "pending",
      deal_id: deal._id,
      task_id: task._id,
      title: "Order Form",
      bucket: process.env.DOCUMENTS_BUCKET,
      path: `deal/order-form/${getDocspringEnvironment()}/${deal._id}/${id}`,
      content_type: "application/pdf",
      uploader_email: deal.manager.email,
      complete: false,
      type: "fm-document",
      metadata: {
        permanent_download_url,
      },
    });
  }

  return {
    download_url,
    task,
  };
};
