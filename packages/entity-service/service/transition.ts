"use strict";
import { transitionHandler } from "@allocations/service-common";
import { phases } from "../redtail.json";
import { Entity } from "@allocations/core-models";

export const handler = transitionHandler({
  phases,
  Model: Entity,
});
