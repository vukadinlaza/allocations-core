import { Deal } from "@allocations/core-models";
import { Entity } from "@allocations/core-models";
import logger from "../../logger";
import { basename } from "path";
import { HttpError } from "@allocations/api-common";
import { ObjectId } from "mongodb";
import fetch from "node-fetch";

const fileName = basename(__filename, ".ts");
const log = logger.child({ module: fileName });

export const updateDealEntity = async (
  deal_id: ObjectId,
  formFields: ProcessStreetFormFields
): Promise<void> => {
  let stand_alone = false;
  let entity: Entity | null = null;
  let entitySplit = formFields.value.split(" a series of ");

  if (entitySplit[1]) {
    entity = (await Entity.findOne({
      name: entityTypeFormat(entitySplit[1]),
    })) as Entity;
  } else {
    entitySplit = formFields.value.split(" - Series ").reverse();
    stand_alone = true;
  }
  const deal = await Deal.findById(deal_id);

  if (!deal) {
    log.error({ err: 404 }, `Entity Update for deal ${deal_id} failed`);
    throw new HttpError(`Deal with id ${deal_id} not found`, 404);
  }

  if (!entity) {
    entity = await Entity.create({
      name: entityTypeFormat(entitySplit[1]),
      structure: deal?.type === "fund" ? "LP" : "LLC",
      stand_alone,
      organization_ids: [deal?.organization_id],
      address_line_1: "8 The Green, Suite A",
      city: "Dover",
      country: "USA",
      state: "Delaware",
      zip_code: "19901",
      phase: "complete",
    });
    // Adding a ts ignore. It looks like organization_ids is used in other parts also, but that field is not part of entity model
    //@ts-ignore
  } else if (!entity?.organization_ids?.includes(deal?.organization_id)) {
    await Entity.findOneAndUpdate(
      { _id: entity._id },
      { $push: { organization_ids: deal?.organization_id } }
    );
  }

  await Deal.findByIdAndUpdate(deal_id, {
    $set: {
      master_entity_id: entity._id,
      series_name: stand_alone ? "" : entitySplit[0],
    },
  });
};

export const entityTypeFormat = (name: string): string => {
  const lowerCaseName = name.toLowerCase();
  if (
    lowerCaseName.endsWith(" lp") ||
    lowerCaseName.endsWith(" llc") ||
    lowerCaseName.endsWith(" inc") ||
    lowerCaseName.endsWith(" corp") ||
    lowerCaseName.endsWith(" inc.") ||
    lowerCaseName.endsWith(" corp.") ||
    lowerCaseName.endsWith(" ltd") ||
    lowerCaseName.endsWith(" ltd.") ||
    // all of the options above, with a comma
    lowerCaseName.endsWith(", lp") ||
    lowerCaseName.endsWith(", llc") ||
    lowerCaseName.endsWith(", inc") ||
    lowerCaseName.endsWith(", corp") ||
    lowerCaseName.endsWith(", inc.") ||
    lowerCaseName.endsWith(", corp.") ||
    lowerCaseName.endsWith(", ltd") ||
    lowerCaseName.endsWith(", ltd.")
  ) {
    const mungedName = name.split(" ");
    mungedName.pop();
    name = mungedName.join(" ");
    name = name.replace(/,/g, "");
  } else if (
    // all of the options above, with a space at the end
    lowerCaseName.endsWith(", lp ") ||
    lowerCaseName.endsWith(", llc ") ||
    lowerCaseName.endsWith(", inc ") ||
    lowerCaseName.endsWith(", corp ") ||
    lowerCaseName.endsWith(", inc. ") ||
    lowerCaseName.endsWith(", corp. ") ||
    lowerCaseName.endsWith(", ltd ") ||
    lowerCaseName.endsWith(", ltd. ") ||
    // or without comma but trailing space
    lowerCaseName.endsWith("lp ") ||
    lowerCaseName.endsWith("llc ") ||
    lowerCaseName.endsWith("inc ") ||
    lowerCaseName.endsWith("corp ") ||
    lowerCaseName.endsWith("inc. ") ||
    lowerCaseName.endsWith("corp. ") ||
    lowerCaseName.endsWith("ltd ") ||
    lowerCaseName.endsWith("ltd. ")
  ) {
    const mungedName = name.split(" ");
    mungedName.pop(); // removes trailing space
    mungedName.pop() as string;

    name = mungedName.join(" ");
    name = name.replace(/,/g, "");
  } else if (
    // or contains trailing space
    lowerCaseName.endsWith(" ")
  ) {
    const mungedName = name.split(" ");
    mungedName.pop() as string;

    name = mungedName.join(" ");
    name = name.replace(/,/g, "");
  }
  return name;
};

export const fetchWithRetry = async (
  url: string,
  options: any,
  tries: number,
  pause: number
) => {
  let response: any;
  const errors = [];

  for (let i = 0; i < tries; i++) {
    await new Promise((resolve) => {
      setTimeout(resolve, pause);
    });

    const res = await fetch(url, options);

    if (res.ok) {
      response = await res.json();
      break;
    } else {
      //@ts-ignore
      errors.push(await res.json());
    }
    console.log({ res }, { response }, { errors: errors[i].errors[0] });
  }
  return { response, errors };
};
