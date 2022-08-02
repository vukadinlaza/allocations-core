"use strict";
import { transitionHandler } from "@allocations/service-common";
import { phases } from "../redtail.json";
import { Investment } from "@allocations/core-models";

export const handler = transitionHandler({
  phases,
  Model: Investment,
});
