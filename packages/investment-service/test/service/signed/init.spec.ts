/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { getDB } from "@allocations/service-testing";

import * as serviceCommon from "@allocations/service-common";
import * as airtableService from "../../../service/airtable";
import { Types } from "mongoose";
import { handler } from "../../../service/airtable-sync/init";
import { Investment } from "@allocations/core-models";
jest.mock("../../../service/airtable");
jest.mock("@allocations/service-common", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  ...jest.requireActual("@allocations/service-common"),
}));

describe("signed tests", () => {
  beforeAll(() => getDB());

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  const deal_id = new Types.ObjectId();
  const investment_id = new Types.ObjectId();
  const transaction_id = new Types.ObjectId();
  const user_id = new Types.ObjectId();
  const investment_input = {
    phase: "signed",
    _id: investment_id.toString(),
    user_id: user_id.toString(),
    investor_name: "Test investor",
    investor_email: "investor@email.com",
    total_committed_amount: 1000,
    transactions: [
      {
        _id: transaction_id.toString(),
        committed_amount: 1000,
        treasury_transaction_id: null,
        wired_amount: null,
        wired_date: null,
      },
    ],
    investor_country: "United States",
    investor_state: "Oregon",
    investor_type: "Entity",
    investor_entity_name: "Test investor entity",
    accredited_investor_type: "I am a really cool investor",
    carry_fee_percent: 0.1,
    management_fee_percent: 0.2,
    metadata: {
      deal_id,
    },
  };

  it("sends acknowledgement and triggers transition if investment is updated", async () => {
    await Investment.create(investment_input);
    const record = {
      body: JSON.stringify({
        Message: JSON.stringify(investment_input),
      }),
    };

    const mockFindByIdOrEmail = jest.spyOn(
      airtableService,
      "findDealTrackerInvestment"
    );
    mockFindByIdOrEmail.mockResolvedValue({
      record_id: "1234",
      "Investor Name": "Test investor",
      "Investor State": "Oregon",
      "Investor Country": "United States",
      "Investor Type": "Entity",
    });

    const triggerTransition = jest
      .spyOn(serviceCommon, "triggerTransition")
      .mockImplementation(() => Promise.resolve());

    await handler({ Records: [record] });

    expect(triggerTransition).toHaveBeenCalledWith({
      action: "DONE",
      phase: "signed",
      id: investment_input._id,
    });
  });
});
