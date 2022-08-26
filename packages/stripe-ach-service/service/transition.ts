import { transitionHandler } from "@allocations/service-common";
import { StripeAccount } from "@allocations/core-models";
import { phases } from "../redtail.json";

export const handler = transitionHandler({
  phases,
  Model: StripeAccount,
});
