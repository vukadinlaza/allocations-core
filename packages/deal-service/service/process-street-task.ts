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
import { updateDealEntity } from "../src/utils/helpers";
import logger from "../logger";
import { basename } from "path";
const fileName = basename(__filename, ".ts");
const log = logger().child({ module: fileName });

export const handler = async (event: LambdaEvent) => {
  try {
    if (!event.body) {
      throw new HttpError("HTTP request must have a body", "400");
    }

    const { data } = JSON.parse(event.body) as ProcessStreetEvent;
    const task = data as ProcessStreetTaskSubmission;
    await connectMongoose();

    const phase = await DealPhase.findOneAndUpdate(
      {
        tasks: {
          $elemMatch: {
            type: "process-street-tasks",
            "metadata.process_street_task_id": task.id,
          },
        },
      },
      {
        "tasks.$.complete": true,
        "tasks.$.metadata.process_street_task_form_fields": JSON.stringify(
          task.formFields
        ),
        "tasks.$.done_by": task.completedBy.email,
      },
      { new: true }
    );

    const detailsTask = task.name === "Enter Deal Details";

    if (phase && detailsTask) {
      updateDealEntity(
        phase.deal_id,
        task.formFields.find((d) => d.label === "SPV Legal Entity Name")!
      );
    }

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
