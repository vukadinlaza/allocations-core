import { Deal } from "@allocations/core-models";
import { connectMongoose, endDBConnection } from "@allocations/service-common";
require("dotenv").config();

const incrementDealVersion = async () => {
  try {
    await connectMongoose();
    await Deal.updateMany({}, { $set: { __v: 1 } });
    endDBConnection();
    process.exit(0);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

incrementDealVersion();
