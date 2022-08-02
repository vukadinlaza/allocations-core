const { token, getDB } = require("@allocations/service-testing");
const { handler: getAllDeals } = require("../service/deal/get-all-deals");
const { createDeal } = require("./data/dataHelpers");

const headers = {
  headers: {
    "X-API-TOKEN": token,
  },
};

const buildEvent = (body) => {
  return {
    body: JSON.stringify(body),
    ...headers,
  };
};

describe("Services - Deal", () => {
  let db;
  beforeAll(async () => {
    db = await getDB();
  });

  test("get-all-deals - with paging", async () => {
    await createDeal(db);
    await createDeal(db);
    await createDeal(db);

    const event1 = buildEvent({ query: {}, paging: { offset: 0, limit: 10 } });
    const page1 = await getAllDeals(event1);

    expect(page1.statusCode).toEqual("200");
    expect(JSON.parse(page1.body)).toHaveLength(3);

    const event2 = buildEvent({ query: {}, paging: { offset: 1, limit: 10 } });
    const page2 = await getAllDeals(event2);

    expect(JSON.parse(page2.body)[0]).toEqual(JSON.parse(page1.body)[1]);
    expect(JSON.parse(page2.body)[1]).toEqual(JSON.parse(page1.body)[2]);
  });

  test("get-all-deals - filter search", async () => {
    const portfolio_company_name = "Oakshire Beer Hall";
    await createDeal(db);
    await createDeal(db, { portfolio_company_name });

    const event = buildEvent({
      query: { portfolio_company_name: "Oakshire Beer Hall" },
      paging: { offset: 0, limit: 10 },
    });
    const result = await getAllDeals(event);

    expect(result.statusCode).toEqual("200");
    expect(JSON.parse(result.body)).toHaveLength(1);
    expect(JSON.parse(result.body)[0].portfolio_company_name).toEqual(
      portfolio_company_name
    );
  });
});
