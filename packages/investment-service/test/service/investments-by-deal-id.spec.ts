/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { getDB } from "@allocations/service-testing";
import { Types } from "mongoose";
import { handler } from "../../service/investments-by-deal-id";
import { buildEvent } from "./test-helpers";
import { Investment } from "@allocations/core-models";

jest.mock("@allocations/service-common", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  ...jest.requireActual("@allocations/service-common"),
}));

describe("docs signed handler", () => {
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SP0R2USEDHqPV7mcIK08ZAs4WtPMQ0NdMHuSD8tnWOw";

  const deal_id = new Types.ObjectId().toString();
  const investments = [
    {
      phase: "new",
      user_id: new Types.ObjectId().toString(),
      investor_email: "investor@email.com",
      investor_name: "Test investor 1",
      total_committed_amount: 5000,
      transactions: [],
      investor_country: "United States",
      investor_state: "Maine",
      investor_type: "Entity",
      investor_entity_name: "Test investor entity",
      accredited_investor_type: "I invested in $SPELL",
      carry_fee_percent: 0.1,
      management_fee_percent: 0.2,
      metadata: { deal_id },
    },
    {
      phase: "new",
      user_id: new Types.ObjectId().toString(),
      investor_email: "investor@email.com",
      investor_name: "Test investor",
      total_committed_amount: 1000,
      transactions: [],
      investor_country: "United States",
      investor_state: "Oregon",
      investor_type: "Entity",
      investor_entity_name: "Test investor entity",
      accredited_investor_type: "I am a really cool investor",
      carry_fee_percent: 0.1,
      management_fee_percent: 0.2,
      metadata: { deal_id },
    },
    {
      phase: "new",
      user_id: new Types.ObjectId().toString(),
      investor_email: "investor@email.com",
      investor_name: "Test investor 3",
      total_committed_amount: 1,
      transactions: [],
      investor_country: "United States",
      investor_state: "NH",
      investor_type: "Entity",
      investor_entity_name: "Test investor entity",
      accredited_investor_type: "I am also a really cool investor",
      carry_fee_percent: 0.1,
      management_fee_percent: 0.2,
      metadata: {},
    },
  ];

  beforeAll(() => getDB());

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it("should return a list of investments that share a deal_id", async () => {
    await Investment.insertMany(investments);
    const event = buildEvent(
      token,
      {},
      {
        deal_id,
      }
    );
    const result = await handler(event);
    const body = JSON.parse(result.body!);
    expect(body.investments).toHaveLength(2);
    expect(body.investments[0]).toMatchObject(investments[0]);
    expect(body.investments[1]).toMatchObject(investments[1]);
  });

  it("should return a 400 error", async () => {
    await Investment.insertMany(investments);
    const event = buildEvent(
      token,
      {},
      {
        deal_id: "baddealid",
      }
    );
    const result = await handler(event);
    const body = JSON.parse(result.body!);
    expect(body).toEqual({
      error: "invalid or missing deal_id: baddealid",
      status: "400",
    });
  });

  it("should return an empty array", async () => {
    await Investment.insertMany(investments);
    const event = buildEvent(
      token,
      {},
      {
        deal_id: new Types.ObjectId().toString(),
      }
    );
    const result = await handler(event);
    const body = JSON.parse(result.body!);
    expect(body.investments).toEqual([]);
  });
});
