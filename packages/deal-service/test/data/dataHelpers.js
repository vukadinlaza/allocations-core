const Deal = require("../../service/schemas/Deal");

const createDeal = async (db, options) => {
  try {
    return Deal.createPhases({
      type: "spv",
      phase: "new",
      investment_advisor: "Sharding Advisers LLC",
      user_id: "5e4d9a334ffe0530c9350d40",
      portfolio_company_name: "Science Fiction Venture Fund III",
      organization_id: "5ff493654ed6240023ded5e4",
      ...options,
    });
  } catch (e) {
    return console.log(e);
  }
};

module.exports = {
  createDeal,
};
