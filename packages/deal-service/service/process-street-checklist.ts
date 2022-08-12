"use strict";
import {
  send,
  sendError,
  connectMongoose,
  LambdaEvent,
  HttpError,
  triggerCheck,
} from "@allocations/service-common";
import { DealPhase } from "@allocations/core-models";
import logger from "../logger";
import { basename } from "path";
const fileName = basename(__filename, ".ts");
const log = logger.child({ module: fileName });

export const handler = async (event: LambdaEvent) => {
  try {
    if (!event.body) {
      throw new HttpError("HTTP request must have a body", "400");
    }

    const { data } = JSON.parse(event.body) as ProcessStreetEvent;
    const checklist = data as ProcessStreetChecklistSubmission;
    await connectMongoose();

    const phase = await DealPhase.findOneAndUpdate(
      {
        tasks: {
          $elemMatch: {
            type: "process-street-checklist",
            "metadata.process_street_checklist_id": checklist.id,
          },
        },
      },
      {
        "tasks.$.complete": true,
        "tasks.$.done_by": checklist.completedBy.email,
      },
      { new: true }
    );

    if (phase) {
      await triggerCheck({
        id: phase.deal_id.toString(),
        check_id: phase._id.toString(),
        phase: phase.name,
      });
    }

    return send({ acknowledged: true });
  } catch (err: any) {
    log.error({ err: err }, err.message);
    return sendError({ error: err, status: err.status });
  }
};
