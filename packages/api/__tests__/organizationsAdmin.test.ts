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

  const user = {
    email: "chase.abbott@allcoations.com",
    _id: new mongoose.Types.ObjectId(),
  };

  let newOrganization: Organization;
  const token = jwt.sign({}, secret);

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    newOrganization = await Organization.create(org1);
  });

  it("Creates one or many new organization admin(s)", async () => {
    const res = await request(app)
      .post(`/api/v1/organizations-admin/${newOrganization._id}`)
      .send({ users: [user] })
      .set({ "X-API-TOKEN": token });

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      {
        __v: 0,
        _id: expect.any(String),
        id: expect.any(String),
        user_email: user.email,
        user_id: user._id.toString(),
        organization_id: newOrganization._id.toString(),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      },
    ]);
  });
});
