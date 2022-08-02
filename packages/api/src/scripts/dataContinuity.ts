import { Deal } from "@allocations/core-models";
import { connectMongoose, endDBConnection } from "@allocations/service-common";
import {
  transformLegacyDeal,
  updateServiceDeal,
} from "../utils/transformDeals";
// import { MongoClient } from "mongodb";

require("dotenv").config();

type LegacyDeal = Partial<Deal> & { legacy_deal: any };

const dataContinuity = async () => {
  try {
    // this commented out code is for inserting legacy deals into the service db, transformLegacyDeal funciton needs to be modified to accomidate

    // const legacyClient = new MongoClient(process.env.LEGACY_MONGO_URL!);

    // await legacyClient.connect();

    // const legacyDeals = legacyClient
    //   .db(process.env.LEGACY_MONGO_DB)
    //   .collection("deals");

    // const allLegacyDeals = await legacyDeals.find().toArray();

    // await connectMongoose();

    // const transformedDeals = allLegacyDeals.map((deal) => {
    //   console.log(deal, "DEAL");
    //   return transformLegacyDeal(deal);
    // });
    // await Deal.insertMany(transformedDeals);

    await connectMongoose();
    const allLegacyDeals: LegacyDeal[] = await Deal.aggregate([
      { $match: { legacy_deal: { $exists: true } } },
    ]);
    const allServiceDeals: Deal[] = await Deal.aggregate([
      { $match: { legacy_deal: { $exists: false } } },
    ]);

    // instead of updating the deals, I opted to replacing them due to the shape being difficult to modify using mongoose queries. May be able to change this in the future
    await Promise.all([
      ...allLegacyDeals.map(async (deal) => {
        const updatedDeal = transformLegacyDeal(deal);
        await Deal.replaceOne({ _id: updatedDeal._id }, updatedDeal);
      }),
      ...allServiceDeals.map(async (deal) => {
        const updatedDeal = updateServiceDeal(deal);
        await Deal.replaceOne({ _id: updatedDeal._id }, updatedDeal);
      }),
    ]);

    console.log(allServiceDeals.length, "SERVICE");

    // increments version of all deals
    await Deal.updateMany({}, { $set: { __v: 1 } });

    endDBConnection();
    process.exit(0);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

dataContinuity();
