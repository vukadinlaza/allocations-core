import { Deal } from "@allocations/core-models";
import { connectMongoose } from "@allocations/api-common/dist/src/testing";
import mongoose from "mongoose";
import { updateDealEntity } from "../src/utils/helpers";
import { ObjectId } from "mongodb";
import { Entity } from "@allocations/core-models";

const dealObj1 = {
  user_id: new mongoose.Types.ObjectId(),
  user_email: "C@C.com",
  type: "spv",
  phase: "new",
  name: "Deal Name",
  master_series: "Atomizer LLC",
  slug: "deal-name",
  carry_fee: "20%",
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
  management_fee: "2%",
  setup_cost: 20000,
  angels_deal: false,
  deal_multiple: 0,
  accept_crypto: false,
  organization_id: "5ecd1a79563730002301759b",
  organization_name: "Chases org",
  allocations_reporting_adviser: true,
  asset_type: "Startup",
  closing_date: "2021-12-28",
  custom_investment_agreement: false,
  international_company: false,
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
  master_entity_id: new mongoose.Types.ObjectId(process.env.ATOMIZER_ID),
};

const entityObj = {
  name: "Fake Entity",
  structure: "LLC",
  stand_alone: false,
  organization_ids: [new ObjectId()],
};
describe("Helper tests", () => {
  beforeAll(async () => {
    return connectMongoose;
  });

  const chase: ProcessStreetUser = {
    id: "String",
    email: "c@c.com",
    username: "chase",
  };

  const formFields: ProcessStreetFormFields = {
    id: "String",
    label: "Enter Deal Details",
    type: "string",
    value: "Chase Abbott a series of Chase Abbott LLC",
    updatedBy: chase,
    hidden: false,
  };

  const standaloneFormFields: ProcessStreetFormFields = {
    id: "String",
    label: "Enter Deal Details",
    type: "string",
    value: "Chase Abbott - Series V",
    updatedBy: chase,
    hidden: false,
  };

  const existingEntityFormFields: ProcessStreetFormFields = {
    id: "String",
    label: "Enter Deal Details",
    type: "string",
    value: "New Deal a series of Fake Entity LLC",
    updatedBy: chase,
    hidden: false,
  };

  let deal1: Deal;

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    deal1 = await Deal.create(dealObj1);
    await Entity.create(entityObj);
  });

  it("Updates a deal entity and creates a non standalone entity", async () => {
    await updateDealEntity(deal1._id, formFields);

    const updatedDeal = await Deal.findById(deal1._id);

    expect(updatedDeal?.master_entity_id).not.toEqual(
      new mongoose.Types.ObjectId(process.env.ATOMIZER_ID)
    );
    expect(updatedDeal?.series_name).toEqual("Chase Abbott");

    const newEntity = await Entity.findById(
      updatedDeal?.master_entity_id
    ).lean();

    expect({ ...newEntity }).toEqual({
      _id: expect.any(ObjectId),
      __v: 0,
      name: "Chase Abbott",
      structure: "LLC",
      stand_alone: false,
      organization_ids: [deal1.organization_id],
      phase: "new",
      entity_type: "MasterEntity",
      address_line_1: "8 The Green, Suite A",
      city: "Dover",
      country: "USA",
      state: "Delaware",
      zip_code: "19901",
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
    });
  });
  it("Updates a deal entity and creates a standalone entity", async () => {
    await updateDealEntity(deal1._id, standaloneFormFields);

    const updatedDeal = await Deal.findById(deal1._id);

    expect(updatedDeal?.master_entity_id).not.toEqual(
      new mongoose.Types.ObjectId(process.env.ATOMIZER_ID)
    );
    expect(updatedDeal?.series_name).toBeFalsy();

    const newEntity = await Entity.findById(
      updatedDeal?.master_entity_id
    ).lean();

    expect({ ...newEntity }).toEqual({
      _id: expect.any(ObjectId),
      __v: 0,
      name: "Chase Abbott",
      structure: "LLC",
      stand_alone: true,
      organization_ids: [deal1.organization_id],
      phase: "new",
      address_line_1: "8 The Green, Suite A",
      city: "Dover",
      country: "USA",
      state: "Delaware",
      zip_code: "19901",
      entity_type: "MasterEntity",
      created_at: expect.any(Date),
      updated_at: expect.any(Date),
    });
  });
  it("Errors out due to incorrect deal_id", async () => {
    try {
      await updateDealEntity(
        new mongoose.Types.ObjectId("5de58116c8df8f0023b414b9"),
        standaloneFormFields
      );
    } catch (e: any) {
      expect(e.status).toBe(404);
    }
  });
  it("Updates a deal entity and updates an existing entity", async () => {
    await updateDealEntity(deal1._id, existingEntityFormFields);

    const updatedDeal = await Deal.findById(deal1._id);

    expect(updatedDeal?.master_entity_id).not.toEqual(
      new mongoose.Types.ObjectId(process.env.ATOMIZER_ID)
    );
    expect(updatedDeal?.series_name).toEqual("New Deal");

    const updatedEntity = await Entity.findOne({
      organization_ids: updatedDeal?.organization_id,
    });

    console.log(updatedEntity, "UPDATED");

    expect({ ...updatedEntity }).toBeTruthy();
  });
});
