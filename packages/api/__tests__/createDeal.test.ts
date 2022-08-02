import { connectMongoose } from "@allocations/api-common/dist/src/testing";
import mongoose from "mongoose";
import app from "../src/app";
import request from "supertest";
import jwt from "jsonwebtoken";
import { DealPhase, Task } from "@allocations/core-models";

const secret = "1234_JEST";
process.env.APP_SECRET = secret;

const dealObj1 = {
  user_id: new mongoose.Types.ObjectId(),
  user_email: "chase@chase.com",
  type: "spv",
  phase: "new",
  name: "Deal Name",
  master_series: "Atomizer LLC",
  slug: "deal-name",
  carry_fee: "20",
  ica_exemption: {
    investor_type: "Accredited Investors",
    exemption_type: "301",
  },
  manager: {
    name: "Fund Manager Name",
    type: "individual",
    email: "jake.pendergraft1@allocations.com",
    title: "",
    entity_representative: "",
  },
  management_fee: "2",
  management_fee_frequency: "one time",
  setup_cost: 20000,
  angels_deal: false,
  deal_multiple: 0,
  accept_crypto: false,
  organization_id: "5ecd1a79563730002301759b",
  organization_name: "Chase's Org",
  allocations_reporting_adviser: true,
  asset_type: "Startup",
  closing_date: "2021-12-28",
  custom_investment_agreement: false,
  international_company: false,
  international_investors: false,
  memo: "memo",
  minimum_investment: 10000,
  gp_entity: {
    gp_entity_name: "New Entity Name",
    need_gp_entity: "true",
  },
  number_of_investments: null,
  offering_type: "506b",
  portfolio_company_name: "Name",
  portfolio_company_securities: "Simple Agreement for Future Equity",
  public_pitch_deck: false,
  representative: "Manager title",
  sectors: ["Biotech"],
  side_letters: false,
  target_raise_goal: 100000,
  type_of_investors: "Accredited Investors (3(c)(1))",
};

describe.skip("Creates a deal for each product", () => {
  beforeAll(async () => {
    return connectMongoose;
  });

  it("Creates an non new HVP SPV deal", async () => {
    const token = jwt.sign({}, secret);
    const res = await await request(app)
      .post("/api/v1/deals")
      .set({ "X-API-TOKEN": token })
      .send({ deal: dealObj1 });

    const createdDeal = res.body.deal;

    expect(res.status).toBe(200);

    const phases = await DealPhase.find({
      deal_id: createdDeal._id,
    });

    console.log(phases, "phases");

    expect(phases.length).toBe(6);

    expect(phases[0].tasks[0].createdAt).toEqual(expect.any(Date));

    // checks tasks in build phase
    expect(phases[0].tasks).toEqual<Task[]>(
      expect.arrayContaining([
        {
          _id: expect.any(mongoose.Types.ObjectId),
          title: "Sign Services Agreement",
          type: "fm-document-signature",
          metadata: {
            key: "services-agreement",
          },
          created_at: expect.any(String),
          updated_at: expect.any(String),
          complete: false,
          required: true,
        },
        {
          _id: expect.any(mongoose.Types.ObjectId),
          title: "Sign Investment Advisory Agreement",
          type: "fm-document-signature",
          metadata: {
            key: "investment-advisory-agreement",
          },
          created_at: expect.any(String),
          updated_at: expect.any(String),
          complete: false,
          required: true,
        },
      ])
    );
  });
});
