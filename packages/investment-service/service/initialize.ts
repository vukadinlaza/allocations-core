import { Investment, Document } from "@allocations/core-models";
import {
  connectMongoose,
  parseRequest,
  send,
  sendError,
  LambdaEvent,
  triggerTransition,
  LambdaResponse,
} from "@allocations/service-common";
import fetch from "node-fetch";

export const handler = async (event: LambdaEvent): Promise<LambdaResponse> => {
  try {
    await connectMongoose();
    const { body } = parseRequest(event);
    const investment = await Investment.findOne({
      _id: body.id,
      phase: "new",
    });
    console.log({ investment, body });

    if (!investment) {
      return send({ acknowledged: true });
    }

    const dealRes = await fetch(
      `${process.env.BUILD_API_URL}/api/v1/deals/${investment.metadata.get(
        "deal_id"
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "X-API-TOKEN": event.headers["X-API-TOKEN"],
        },
      }
    );
    console.log({ dealRes });
    const deal = await dealRes.json();

    const document = await Document.create({
      investment_id: body.id,
      title: `Private Fund Documents - ${deal.name}`,
      bucket: "",
      path: "",
      content_type: "",
      complete: false,
      created_by: body.investor_email,
    });

    console.log({ document });

    if (investment.metadata.get("invited")) {
      await triggerTransition({
        id: investment._id.toString(),
        action: "CREATED_WITH_INVITE",
        phase: "new",
      });

      return send({ acknowledged: true });
    }
    console.log("ROPIV", process.env.SERVICE_TOPIC);
    await triggerTransition({
      id: investment._id.toString(),
      action: "CREATED",
      phase: "new",
    });

    return send({ acknowledged: true });
  } catch (err: any) {
    console.error(err);
    return sendError({ error: err as Error, status: "500" });
  }
};
