import mongoose from "mongoose";
import {
  DealAgreement,
  DealAsset,
  DealPhase,
  Document,
} from "@allocations/core-models";

(async () => {
  await mongoose.connect(
    "mongodb+srv://allocations-test-2022:dcVnrbZIqXS1rcYP@cluster0.jr4fz.mongodb.net/deal-service-staging"
  );

  const documents = await Document.find();

  for (const doc of documents) {
    if (doc.title === "Cover Image") {
      await DealAsset.create({
        deal_id: doc.deal_id,
        internal: false,
        md5: "",
        s3_bucket: doc.bucket,
        s3_key: doc.path,
        title: doc.title,
        uploaded: true,
        type: "cover-image",
      });
      continue;
    } else if (doc.title === "Wire Instructions") {
      await DealAsset.create({
        deal_id: doc.deal_id,
        internal: true,
        md5: "",
        s3_bucket: doc.bucket,
        s3_key: doc.path,
        title: doc.title,
        uploaded: true,
        type: "deal-wire-instructions",
      });
      continue;
    } else if (doc.title === "Services Agreement") {
      await DealAgreement.create({
        deal_id: doc.deal_id,
        internal: true,
        md5: "",
        signed: true,
        s3_bucket: doc.bucket,
        s3_key: doc.path,
        title: doc.title,
        uploaded: true,
        type: "services-agreement",
      });
      continue;
    } else if (doc.title === "Investment Advisory Agreement") {
      await DealAgreement.create({
        deal_id: doc.deal_id,
        internal: true,
        md5: "",
        signed: true,
        s3_bucket: doc.bucket,
        s3_key: doc.path,
        title: doc.title,
        uploaded: true,
        type: "advisory-agreement",
      });
      continue;
    } else if (doc.title === "Presigned Subscription Agreement") {
      await DealAgreement.create({
        deal_id: doc.deal_id,
        internal: true,
        md5: "",
        signed: true,
        s3_bucket: doc.bucket,
        s3_key: doc.path,
        title: doc.title,
        uploaded: true,
        type: "subscription-agreement",
      });
      continue;
    }
    const phase = await DealPhase.findOne({
      deal_id: doc.deal_id,
      "tasks._id": doc.task_id,
    });

    if (!phase) continue;

    const task = phase.tasks.find((task) => task._id === doc.task_id);
    if (!task) continue;

    if (task.title === "Upload Term Sheet") {
      await DealAsset.create({
        deal_id: doc.deal_id,
        internal: false,
        md5: "",
        s3_bucket: doc.bucket,
        s3_key: doc.path,
        title: doc.title,
        uploaded: true,
        type: "term-sheet",
      });
    } else if (
      task.title === "Upload Portfolio Company Wire Instructions (Optional)"
    ) {
      await DealAsset.create({
        deal_id: doc.deal_id,
        internal: false,
        md5: "",
        s3_bucket: doc.bucket,
        s3_key: doc.path,
        title: doc.title,
        uploaded: true,
        type: "portfolio-company-wire-instructions",
      });
    } else if (task.title === "Upload Company Deck") {
      await DealAsset.create({
        deal_id: doc.deal_id,
        internal: false,
        md5: "",
        s3_bucket: doc.bucket,
        s3_key: doc.path,
        title: doc.title,
        uploaded: true,
        type: "pitch-deck",
      });
      continue;
    }
  }

  await mongoose.connection.close();
})();
