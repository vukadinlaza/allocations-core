import { DealPhase, Document } from "@allocations/core-models";
import { MongoClient } from "mongodb";
import { connectMongoose, endDBConnection } from "@allocations/service-common";
import S3 from "aws-sdk/clients/s3";

const s3 = new S3({ apiVersion: "2006-03-01" });
require("dotenv").config();
const coverImagePort = async () => {
  try {
    await connectMongoose();
    const legacyClient = new MongoClient(process.env.LEGACY_MONGO_URL!);

    await legacyClient.connect();

    const legacyDeals = legacyClient
      .db(process.env.LEGACY_MONGO_DB)
      .collection("deals");

    const allDeals = await legacyDeals.find().toArray();

    await Promise.all(
      allDeals.map(async (deal: any) => {
        let logo = null;
        if (deal?.dealCoverImageKey) {
          // creates a new Document in the db so we can ready cover images
          logo = await Document.create({
            deal_id: deal._id,
            bucket: "allocations-deal-documents-production",
            complete: true,
            content_type: "image/png",
            path: `deal/uploads/${deal._id}/coverImage.png`,
            title: "Cover Image",
            type: "upload",
          });
          // copies the deal cover image to a different bucket due to reading issues
          s3.copyObject(
            {
              Bucket: "allocations-deal-documents-production",
              CopySource: `allocations-public/${deal.dealCoverImageKey}`,
              Key: `deal/uploads/${deal._id}/coverImage.png`,
            },
            (err, data) => {
              if (err) console.log("ITS THE GET METHOD");
              return data;
            }
          );
        }

        // creates the PreOnboarding phase with the Upload Company Logo tasks for each deal so we can more easily determine what the company logo is on the FE by searching for documents by task_id
        const dealPhase = await DealPhase.create({
          name: "pre-onboarding",
          deal_id: deal._id,
          tasks: [
            {
              title: "Upload Company Logo (Optional)",
              type: "fm-document-upload",
              required: false,
              complete: logo ? true : false,
              ...(logo
                ? { metadata: { document_id: logo._id } }
                : { metadata: {} }),
            },
          ],
        });

        // If a cover image document was created, update the Document with the task id from above
        if (logo) {
          await Document.findOneAndUpdate(
            { _id: logo._id },
            { $set: { task_id: dealPhase.tasks[0]._id } }
          );
        }
      })
    );

    endDBConnection();
    process.exit(0);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

coverImagePort();
