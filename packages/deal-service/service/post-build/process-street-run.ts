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

export const handler = async (event: LambdaEvent) => {
  try {
    if (!event.body) {
      throw new HttpError("HTTP request must have a body", "400");
    }

    const { data } = JSON.parse(event.body) as ProcessStreetEvent;
    const checklist = data as ProcessStreetChecklistSubmission;
    await connectMongoose();

    const deal_id = checklist.name.slice(-24);

    const [phase] = await Promise.all([
      DealPhase.findOneAndUpdate(
        {
          deal_id,
          name: "post-build",
          "tasks.title": `Create Process Street Run: ${checklist.template.name}`,
        },
        { "tasks.$.complete": true }
      ),
      DealPhase.updateMany(
        {
          deal_id,
          tasks: {
            $elemMatch: {
              type: "process-street-checklist",
              "metadata.template_name": checklist.template.name,
            },
          },
        },
        { "tasks.$.metadata.process_street_checklist_id": checklist.id }
      ),
      Promise.all(
        checklist.tasks.map((task) => {
          return DealPhase.updateMany(
            {
              deal_id,
              tasks: {
                $elemMatch: {
                  type: "process-street-tasks",
                  "metadata.template_name": checklist.template.name,
                  "metadata.task_name": task.name,
                },
              },
            },
            { "tasks.$.metadata.process_street_task_id": task.id }
          );
        })
      ),
    ]);

    if (phase) {
      await triggerCheck({
        id: deal_id,
        check_id: phase._id.toString(),
        phase: "post-build",
      });
    }

    return send({ acknowledged: true });
  } catch (err: any) {
    console.error(err);
    return sendError({ error: err, status: err.status });
  }
};
