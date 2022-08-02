/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { getDB } from "@allocations/service-testing";
import * as serviceCommon from "@allocations/service-common";
import { Types } from "mongoose";
import { handler } from "../../../service/invited/docs-signed";
import { buildEvent } from "../test-helpers";
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

  beforeAll(() => getDB());

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.resetAllMocks();
  });

  const user_id = new Types.ObjectId();

  const investment_input = {
    phase: "new",
    user_id: user_id.toString(),
    investor_email: "investor@email.com",
  };

  const postSignInvestInfo = {
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
    metadata: {},
  };

  it("should update the investment data once the docs have been signed", async () => {
    const investment = await Investment.create(investment_input);
    expect(investment).not.toMatchObject(postSignInvestInfo);
    const event = buildEvent(token, postSignInvestInfo, {
      investment_id: investment._id.toString(),
    });
    const triggerTransition = jest
      .spyOn(serviceCommon, "triggerTransition")
      .mockImplementation(() => Promise.resolve());
    await handler(event);

    expect(triggerTransition).toHaveBeenCalledTimes(1);
    expect(triggerTransition).toHaveBeenCalledWith({
      id: investment._id.toString(),
      action: "DONE",
      phase: "invited",
    });
    const updatedInvestment = await Investment.findById(
      investment._id.toString()
    );
    expect(updatedInvestment).toMatchObject(postSignInvestInfo);
  });
});
