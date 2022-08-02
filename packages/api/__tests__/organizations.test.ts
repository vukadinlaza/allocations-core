import { connectMongoose } from "@allocations/api-common/dist/src/testing";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../src/app";
import request from "supertest";
import { Organization } from "@allocations/core-models";

const secret = "1234_JEST";
process.env.APP_SECRET = secret;

describe.skip("Deal CRUD routes", () => {
  beforeAll(async () => {
    return connectMongoose;
  });

  const org1 = {
    name: "Chases org",
    high_volume_partner: true,
    slug: "chase 123",
    master_series: "Chase",
  };

  const org2 = {
    name: "Chases New org",
    high_volume_partner: false,
    slug: "chase 123",
    master_series: "Chase",
  };

  const user = {
    email: "chase.abbott@allcoations.com",
    _id: new mongoose.Types.ObjectId(),
  };

  let newOrganization: Organization;
  const token = jwt.sign({}, secret);

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    newOrganization = await Organization.create(org2);
  });

  it("Creates an organization", async () => {
    const newOrg = await request(app)
      .post("/api/v1/organizations")
      .send({ organization: org1, user })
      .set({ "X-API-TOKEN": token });

    const orgId = newOrg.body.organization._id;

    expect(newOrg.body).toEqual({
      organization: {
        __v: 0,
        _id: expect.any(String),
        id: expect.any(String), // this is a weird behavior maybe by memoryserver
        name: "Chases org",
        high_volume_partner: true,
        slug: "chase 123",
        master_series: "Chase",
        phase: "new",
        created_at: expect.any(String),
        updated_at: expect.any(String),
      },
      organizationAdmin: {
        __v: 0,
        _id: expect.any(String),
        id: expect.any(String),
        organization_id: orgId,
        user_id: user._id.toString(),
        user_email: user.email,
        created_at: expect.any(String),
        updated_at: expect.any(String),
      },
    });
  });

  it("Gets an organization by its id", async () => {
    const orgId = newOrganization._id;
    const res = await request(app)
      .get(`/api/v1/organizations/${orgId}`)
      .set({ "X-API-TOKEN": token });

    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      __v: 0,
      _id: expect.any(String),
      id: expect.any(String), // this is a weird behavior maybe by memoryserver
      name: "Chases New org",
      high_volume_partner: false,
      slug: "chase 123",
      master_series: "Chase",
      phase: "new",
      created_at: expect.any(String),
      updated_at: expect.any(String),
    });
  });

  it("Updates an organization by its id", async () => {
    const res = await request(app)
      .put(`/api/v1/organizations/${newOrganization._id}`)
      .send({ name: "New Deal Name" })
      .set({ "X-API-TOKEN": token });

    expect(res.status).toBe(200);
    expect(res.body.name).toEqual("New Deal Name");
    expect(res.body._id).toStrictEqual(newOrganization._id.toString());
  });

  it("Deletes an organization by its id", async () => {
    const deletedOrg = await request(app)
      .delete(`/api/v1/organizations/${newOrganization._id}`)
      .set({ "X-API-TOKEN": token });

    expect(deletedOrg.status).toBe(200);
    expect(deletedOrg.body).toEqual({ deletedCount: 1 });

    const findDeletedOrg = await Organization.findById(newOrganization._id);
    expect(findDeletedOrg).toBeNull();
  });
});
