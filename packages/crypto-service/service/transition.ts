"use strict";
import { transitionHandler } from "@allocations/service-common";
import { CryptoTransaction } from "@allocations/core-models";
import { phases } from "../redtail.json";

export const handler = transitionHandler({
  phases,
  Model: CryptoTransaction,
});
