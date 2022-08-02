/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { getDB } from "@allocations/service-testing";
import * as serviceCommon from "@allocations/service-common";
import { Types } from "mongoose";
import { handler } from "../../service/update-investment";
import { Investment } from "@allocations/core-models";
import { buildEvent } from "./test-helpers";

jest.mock("@allocations/service-common", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  ...jest.requireActual("@allocations/service-common"),
}));

describe("update tests", () => {
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SP0R2USEDHqPV7mcIK08ZAs4WtPMQ0NdMHuSD8tnWOw";

  beforeAll(() => getDB());

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  it("sends an error if the investment not found", async () => {
    const investment_id = new Types.ObjectId();
    const event = buildEvent(token, {}, { investment_id });
    const triggerTransition = jest
      .spyOn(serviceCommon, "triggerTransition")
      .mockImplementation(() => Promise.resolve());
    const result = await handler(event);
    const body = JSON.parse(result.body!);

    expect(triggerTransition).not.toHaveBeenCalled();
    expect(body).toEqual(
      expect.objectContaining({
        error: `No investment found with id: ${investment_id}`,
        status: "500",
      })
    );
  });

  it("sends acknowledgement and triggers transition if investment is updated", async () => {
    const deal_id = new Types.ObjectId();
    const transaction_id = new Types.ObjectId();
    const _id = new Types.ObjectId();
    const wire_date = new Date("2021-11-29T15:39:19.401Z");
    const investment = await Investment.create({
      _id,
      investor_email: "investor@email.com",
      phase: "signed",
      total_committed_amount: 1000,
      transactions: [
        {
          treasury_transaction_id: transaction_id,
          committed_amount: 1000,
          wired_amount: null,
          wired_date: null,
        },
      ],
      carry_fee_percent: 0.3,
      management_fee_percent: 0.1,
      metadata: {
        deal_id,
      },
    });

    const event = buildEvent(
      token,
      { wired_amount: 1000, wired_date: wire_date },
      { investment_id: investment._id }
    );

    const triggerTransition = jest
      .spyOn(serviceCommon, "triggerTransition")
      .mockImplementation(() => Promise.resolve());
    const result = await handler(event);
    const body = JSON.parse(result.body!);
    const updatedInvestment = await Investment.findOne({
      _id: investment._id,
    });

    expect(updatedInvestment!.transactions).toHaveLength(1);
    expect(
      JSON.parse(JSON.stringify(updatedInvestment!.transactions))
    ).toContainEqual({
      _id: expect.any(String),
      treasury_transaction_id: transaction_id.toString(),
      committed_amount: 1000,
      wired_amount: 1000,
      wired_date: wire_date.toISOString(),
    });
    expect(triggerTransition).toHaveBeenCalledWith({
      action: "DONE",
      phase: body.phase,
      id: investment._id.toString(),
    });
    expect(body).toEqual(
      expect.objectContaining({
        acknowledged: true,
        _id: investment._id.toString(),
      })
    );
  });
});
