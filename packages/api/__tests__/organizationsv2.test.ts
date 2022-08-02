import { connectMongoose } from "@allocations/api-common/dist/src/testing";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import app from "../src/app";
import request from "supertest";
import { Organization } from "@allocations/core-models";

const secret = "1234_JEST";
process.env.APP_SECRET = secret;

describe("Organization V2 Routes", () => {
  beforeAll(async () => {
    return connectMongoose;
  });

  const token = jwt.sign({}, secret);

  beforeEach(async () => {
    await mongoose.connection.dropDatabase();
    for (let i = 0; i < 25; i++) {
      const org = {
        name: `Chases org ${i}`,
        high_volume_partner: true,
        slug: "chase 123",
        master_series: "Chase",
        phase: "new",
      };
      await Organization.create(org);
    }
    for (let i = 0; i < 25; i++) {
      const org = {
        name: `Chases org ${i + 25}`,
        high_volume_partner: true,
        slug: "chase 123",
        master_series: "Chase",
        phase: "complete",
      };
      await Organization.create(org);
    }
  });

  it("Gets a list of organizations by query", async () => {
    const orgs = await request(app)
      .get("/api/v2/organizations?name=Chases+org+1")
      .set({ "X-API-TOKEN": token });

    expect(orgs.body).toEqual([
      {
        __v: 0,
        _id: expect.any(String),
        id: expect.any(String), // this is a weird behavior maybe by memoryserver
        name: "Chases org 1",
        high_volume_partner: true,
        mou_signed: false,
        slug: "chase 123",
        master_series: "Chase",
        phase: "new",
        created_at: expect.any(String),
        updated_at: expect.any(String),
      },
    ]);

    const moreOrgs = await request(app)
      .get("/api/v2/organizations?high_volume_partner=true")
      .set({ "X-API-TOKEN": token });

    expect(moreOrgs.body).toEqual(
      expect.arrayContaining([
        {
          __v: 0,
          _id: expect.any(String),
          id: expect.any(String), // this is a weird behavior maybe by memoryserver
          name: "Chases org 1",
          high_volume_partner: true,
          mou_signed: false,
          slug: "chase 123",
          master_series: "Chase",
          phase: "new",
          created_at: expect.any(String),
          updated_at: expect.any(String),
        },
      ])
    );
  });
  it("Gets a list of # of organizations in each phase", async () => {
    const count = await request(app)
      .get("/api/v2/organizations/totals")
      .set({ "X-API-TOKEN": token });

    expect(count.body).toEqual(
      expect.arrayContaining([
        { phase: "complete", count: 25 },
        { phase: "new", count: 25 },
      ])
    );
  });
});
