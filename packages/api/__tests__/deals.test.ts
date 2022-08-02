import { Deal } from "@allocations/core-models";
import { connectMongoose } from "@allocations/api-common/dist/src/testing";
import mongoose from "mongoose";
import app from "../src/app";
import request from "supertest";
import jwt from "jsonwebtoken";

const secret = "1234_JEST";
process.env.APP_SECRET = secret;

describe.skip("Deal CRUD routes", () => {
  beforeAll(async () => {
    return connectMongoose;
  });

  const dealObj1 = {
    user_id: new mongoose.Types.ObjectId(),
    type: "spv",
    phase: "new",
    name: "Deal Name",
    master_series: "Atomizer LLC",
    slug: "deal-name",
    carry_fee: {
      type: "percent",
      value: "20",
      custom: "false",
      string_value: "20 percent",
    },
    ica_exemption: {
      investor_type: "Accredited Investors",
      exemption_type: "301",
    },
    investor_countries: ["United States"],
    manager: {
      name: "Fund Manager Name",
      type: "individual",
      email: "jake.pendergraft1@allocations.com",
      title: "",
      entity_representative: "",
    },
    management_fee: {
      type: "percent",
      value: "2",
      custom: "false",
      string_value: "2 percent",
    },
    setup_cost: 20000,
    angels_deal: false,
    deal_multiple: 0,
    accept_crypto: false,
    organization_id: "5ecd1a79563730002301759b",
    allocations_reporting_adviser: true,
    asset_type: "Startup",
    closing_date: "2021-12-28",
    custom_investment_agreement: false,
    international_company: { status: "false", country: "" },
    management_fee_frequency: "one time",
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

  const dealObj2 = {
    user_id: new mongoose.Types.ObjectId(),
    type: "fund",
    phase: "new",
    name: "Deal 2",
    master_series: "Atomizer LLC",
    slug: "deal-2",
    carry_fee: {
      type: "percent",
      value: "20",
      custom: "false",
      string_value: "20 percent",
    },
    ica_exemption: {
      investor_type: "Accredited Investors",
      exemption_type: "301",
    },
    investor_countries: ["United States"],
    manager: {
      name: "Fund Manager Name",
      type: "individual",
      email: "jake.pendergraft1@allocations.com",
      title: "",
      entity_representative: "",
    },
    management_fee: {
      type: "percent",
      value: "2",
      custom: "false",
      string_value: "2 percent",
    },
    setup_cost: 20000,
    angels_deal: false,
    deal_multiple: 0,
    accept_crypto: false,
    organization_id: "5ecd1a79563730002301759b",
    allocations_reporting_adviser: true,
    asset_type: "Startup",
    closing_date: "2021-12-28",
    custom_investment_agreement: false,
    international_company: { status: "false", country: "" },
    management_fee_frequency: "one time",
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

  let deal1: Deal;
  let deal2: Deal;

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    deal1 = await Deal.create(dealObj1);
    deal2 = await Deal.create(dealObj2);
  });

  it("It gets an array of all deals with GET", async () => {
    const token = jwt.sign({}, secret);
    const res = await request(app)
      .get("/api/v1/deals")
      .set({ "X-API-TOKEN": token });

    expect(res.body).toEqual([
      {
        __v: 0,
        _id: expect.any(String),
        allocations_reporting_adviser: true,
        angels_deal: false,
        asset_type: "Startup",
        carry_fee: {
          custom: "false",
          string_value: "20 percent",
          type: "percent",
          value: "20",
        },
        closing_date: "2021-12-28T00:00:00.000Z",
        created_at: expect.any(String),
        custom_investment_agreement: false,
        deal_multiple: 0,
        deal_term: "10 years",
        ica_exemption: {
          exemption_type: "301",
          investor_type: "Accredited Investors",
        },
        id: expect.any(String),
        international_company: {
          country: "",
          status: "false",
        },
        investor_countries: ["United States"],
        management_fee: {
          custom: "false",
          string_value: "2 percent",
          type: "percent",
          value: "2",
        },
        management_fee_frequency: "one time",
        manager: {
          email: "jake.pendergraft1@allocations.com",
          entity_representative: "",
          name: "Fund Manager Name",
          title: "",
          type: "individual",
        },
        master_series: "Atomizer LLC",
        memo: "memo",
        minimum_investment: 10000,
        name: "Deal Name",
        gp_entity: {
          gp_entity_name: "New Entity Name",
          need_gp_entity: "true",
        },
        number_of_investments: null,
        offering_type: "506b",
        organization_id: "5ecd1a79563730002301759b",
        phase: "new",
        portfolio_company_name: "Name",
        portfolio_company_securities: "Simple Agreement for Future Equity",
        public_pitch_deck: false,
        reporting_adviser: "Sharding Advisers LLC",
        representative: "Manager title",
        sectors: ["Biotech"],
        setup_cost: 20000,
        side_letters: false,
        slug: "deal-name",
        target_raise_goal: 100000,
        type: "spv",
        type_of_investors: "Accredited Investors (3(c)(1))",
        updated_at: expect.any(String),
        user_id: deal1.user_id.toString(),
      },
      {
        __v: 0,
        _id: expect.any(String),
        allocations_reporting_adviser: true,
        angels_deal: false,
        asset_type: "Startup",
        carry_fee: {
          custom: "false",
          string_value: "20 percent",
          type: "percent",
          value: "20",
        },
        closing_date: "2021-12-28T00:00:00.000Z",
        created_at: expect.any(String),
        custom_investment_agreement: false,
        deal_multiple: 0,
        deal_term: "10 years",
        ica_exemption: {
          exemption_type: "301",
          investor_type: "Accredited Investors",
        },
        id: expect.any(String),
        international_company: {
          country: "",
          status: "false",
        },
        investor_countries: ["United States"],
        management_fee: {
          custom: "false",
          string_value: "2 percent",
          type: "percent",
          value: "2",
        },
        management_fee_frequency: "one time",
        manager: {
          email: "jake.pendergraft1@allocations.com",
          entity_representative: "",
          name: "Fund Manager Name",
          title: "",
          type: "individual",
        },
        master_series: "Atomizer LLC",
        memo: "memo",
        minimum_investment: 10000,
        name: "Deal 2",
        gp_entity: {
          gp_entity_name: "New Entity Name",
          need_gp_entity: "true",
        },
        number_of_investments: null,
        offering_type: "506b",
        organization_id: "5ecd1a79563730002301759b",
        phase: "new",
        portfolio_company_name: "Name",
        portfolio_company_securities: "Simple Agreement for Future Equity",
        public_pitch_deck: false,
        reporting_adviser: "Sharding Advisers LLC",
        representative: "Manager title",
        sectors: ["Biotech"],
        setup_cost: 20000,
        side_letters: false,
        slug: "deal-2",
        target_raise_goal: 100000,
        type: "fund",
        type_of_investors: "Accredited Investors (3(c)(1))",
        updated_at: expect.any(String),
        user_id: deal2.user_id.toString(),
      },
    ]);
  });

  it("It gets an array of deals by query string with GET", async () => {
    const token = jwt.sign({}, secret);
    const res = await request(app)
      .get("/api/v1/deals?type=fund")
      .set({ "X-API-TOKEN": token });

    expect(res.body).toEqual([
      {
        __v: 0,
        _id: expect.any(String),
        allocations_reporting_adviser: true,
        angels_deal: false,
        asset_type: "Startup",
        carry_fee: {
          custom: "false",
          string_value: "20 percent",
          type: "percent",
          value: "20",
        },
        closing_date: "2021-12-28T00:00:00.000Z",
        created_at: expect.any(String),
        custom_investment_agreement: false,
        deal_multiple: 0,
        deal_term: "10 years",
        ica_exemption: {
          exemption_type: "301",
          investor_type: "Accredited Investors",
        },
        id: expect.any(String),
        international_company: {
          country: "",
          status: "false",
        },
        investor_countries: ["United States"],
        management_fee: {
          custom: "false",
          string_value: "2 percent",
          type: "percent",
          value: "2",
        },
        management_fee_frequency: "one time",
        manager: {
          email: "jake.pendergraft1@allocations.com",
          entity_representative: "",
          name: "Fund Manager Name",
          title: "",
          type: "individual",
        },
        master_series: "Atomizer LLC",
        memo: "memo",
        minimum_investment: 10000,
        name: "Deal 2",
        gp_entity: {
          gp_entity_name: "New Entity Name",
          need_gp_entity: "true",
        },
        number_of_investments: null,
        offering_type: "506b",
        organization_id: "5ecd1a79563730002301759b",
        phase: "new",
        portfolio_company_name: "Name",
        portfolio_company_securities: "Simple Agreement for Future Equity",
        public_pitch_deck: false,
        reporting_adviser: "Sharding Advisers LLC",
        representative: "Manager title",
        sectors: ["Biotech"],
        setup_cost: 20000,
        side_letters: false,
        slug: "deal-2",
        target_raise_goal: 100000,
        type: "fund",
        type_of_investors: "Accredited Investors (3(c)(1))",
        updated_at: expect.any(String),
        user_id: deal2.user_id.toString(),
      },
    ]);
  });

  it("It gets a deal by id with GET", async () => {
    const token = jwt.sign({}, secret);
    const res = await request(app)
      .get(`/api/v1/deals/${deal1._id}`)
      .set({ "X-API-TOKEN": token });

    expect(res.body).toEqual({
      __v: 0,
      _id: expect.any(String),
      allocations_reporting_adviser: true,
      angels_deal: false,
      asset_type: "Startup",
      carry_fee: {
        custom: "false",
        string_value: "20 percent",
        type: "percent",
        value: "20",
      },
      closing_date: "2021-12-28T00:00:00.000Z",
      created_at: expect.any(String),
      custom_investment_agreement: false,
      deal_multiple: 0,
      deal_term: "10 years",
      ica_exemption: {
        exemption_type: "301",
        investor_type: "Accredited Investors",
      },
      id: expect.any(String),
      international_company: {
        country: "",
        status: "false",
      },
      investor_countries: ["United States"],
      management_fee: {
        custom: "false",
        string_value: "2 percent",
        type: "percent",
        value: "2",
      },
      management_fee_frequency: "one time",
      manager: {
        email: "jake.pendergraft1@allocations.com",
        entity_representative: "",
        name: "Fund Manager Name",
        title: "",
        type: "individual",
      },
      master_series: "Atomizer LLC",
      memo: "memo",
      minimum_investment: 10000,
      name: "Deal Name",
      gp_entity: {
        gp_entity_name: "New Entity Name",
        need_gp_entity: "true",
      },
      number_of_investments: null,
      offering_type: "506b",
      organization_id: "5ecd1a79563730002301759b",
      phase: "new",
      portfolio_company_name: "Name",
      portfolio_company_securities: "Simple Agreement for Future Equity",
      public_pitch_deck: false,
      reporting_adviser: "Sharding Advisers LLC",
      representative: "Manager title",
      sectors: ["Biotech"],
      setup_cost: 20000,
      side_letters: false,
      slug: "deal-name",
      target_raise_goal: 100000,
      type: "spv",
      type_of_investors: "Accredited Investors (3(c)(1))",
      updated_at: expect.any(String),
      user_id: deal1.user_id.toString(),
    });
  });

  it("It can update a deal by id", async () => {
    const token = jwt.sign({}, secret);
    const res = await request(app)
      .put(`/api/v1/deals/${deal1._id}`)
      .set({ "X-API-TOKEN": token })
      .send({
        name: "New Deal Name",
      });

    expect(res.body).toEqual({
      __v: 0,
      _id: expect.any(String),
      allocations_reporting_adviser: true,
      angels_deal: false,
      asset_type: "Startup",
      carry_fee: {
        custom: "false",
        string_value: "20 percent",
        type: "percent",
        value: "20",
      },
      closing_date: "2021-12-28T00:00:00.000Z",
      created_at: expect.any(String),
      custom_investment_agreement: false,
      deal_multiple: 0,
      deal_term: "10 years",
      ica_exemption: {
        exemption_type: "301",
        investor_type: "Accredited Investors",
      },
      id: expect.any(String),
      international_company: {
        country: "",
        status: "false",
      },
      investor_countries: ["United States"],
      management_fee: {
        custom: "false",
        string_value: "2 percent",
        type: "percent",
        value: "2",
      },
      management_fee_frequency: "one time",
      manager: {
        email: "jake.pendergraft1@allocations.com",
        entity_representative: "",
        name: "Fund Manager Name",
        title: "",
        type: "individual",
      },
      master_series: "Atomizer LLC",
      memo: "memo",
      minimum_investment: 10000,
      name: "New Deal Name",
      gp_entity: {
        gp_entity_name: "New Entity Name",
        need_gp_entity: "true",
      },
      number_of_investments: null,
      offering_type: "506b",
      organization_id: "5ecd1a79563730002301759b",
      phase: "new",
      portfolio_company_name: "Name",
      portfolio_company_securities: "Simple Agreement for Future Equity",
      public_pitch_deck: false,
      reporting_adviser: "Sharding Advisers LLC",
      representative: "Manager title",
      sectors: ["Biotech"],
      setup_cost: 20000,
      side_letters: false,
      slug: "deal-name",
      target_raise_goal: 100000,
      type: "spv",
      type_of_investors: "Accredited Investors (3(c)(1))",
      updated_at: expect.any(String),
      user_id: deal1.user_id.toString(),
    });
  });

  // it('Creates an SPV deal with POST', async () => {
  //     const token = jwt.sign({}, secret);
  //     const res = await request(app)
  //         .post("/api/v1/deals")
  //         .set({ "X-API-TOKEN": token })
  //         .send({
  //             deal,
  //             isNewHVP: false,
  //             organization: {
  //                 master_series: 'Atomizer LLC',
  //                 __typename: 'Organization',
  //                 _id: '5ecd1a79563730002301759b',
  //                 logo: null,
  //                 name: 'Repair Biotechnologies',
  //                 slug: 'repair-biotechnologies'
  //             },
  //         });
  //     expect(res.body).toEqual({
  //         deal: {
  //             _id: expect.any(mongoose.Types.ObjectId),
  //             ...deal,
  //         },
  //         documents: {},
  //         phases: []
  //     });
  // })
});
