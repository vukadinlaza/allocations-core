import * as t from "runtypes";
import { validateValue } from "../../service/validate-value";

describe("Unit: validateValue", () => {
  const TestResponseSchema = t.Record({
    status: t.Union(t.Literal("OK"), t.Literal("FAILURE")),
    code: t.Number,
    body: t.Record({
      foo: t.Array(t.String.Or(t.Null)),
    }),
  });

  it("returns the response if it matches the schema", () => {
    const testResponse = {
      status: "OK",
      code: 201,
      body: {
        foo: ["super-cool-string"],
      },
    };

    const result = validateValue({
      schema: TestResponseSchema,
      value: testResponse,
    });

    expect(result).toMatchSnapshot();
  });

  it("returns an error and success:false if response does not match schema", () => {
    const testResponse = {
      status: "OK",
      code: 404,
      body: {
        error: "you failed",
      },
    };

    const result = validateValue({
      schema: TestResponseSchema,
      value: testResponse,
    });

    expect(result).toMatchSnapshot();
  });
});
