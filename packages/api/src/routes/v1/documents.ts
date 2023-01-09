import { Router } from "express";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { HttpError, logger } from "@allocations/api-common";
import { Deal, DealPhase, Document, Task } from "@allocations/core-models";
import type { DealPhase as DealPhaseType } from "@allocations/core-models";
import {
  createOrderForm,
  createServicesAgreement,
} from "../../utils/servicesAgreement";
import { createAdvisoryAgreement } from "../../utils/advisoryAgreement";
import {
  createMemorandumOfUnderstanding,
  getMemorandumOfUnderstanding,
} from "../../utils/memorandumOfUnderstanding";
import { deleteDocumentByTaskId } from "../../utils/documents";
import { Organization } from "@allocations/core-models";
import { basename } from "path";
import { ObjectId } from "mongodb";
import mongoose from "mongoose";
const fileName = basename(__filename, ".ts");
const log = logger.child({ module: fileName });
// @ts-ignore
import DocSpring from "docspring";
const config = new DocSpring.Configuration();
config.apiTokenId = process.env.DOCSPRING_TOKEN_ID;
config.apiTokenSecret = process.env.DOCSPRING_TOKEN_SECRET;

let docspring = new DocSpring.Client(config);

const client = new S3Client({ region: "us-east-1" });

type MungedDealPhase = Omit<DealPhaseType, "tasks"> & { tasks: Task };

export default Router()
  .post("/upload-link/:task_id", async (req, res, next) => {
    try {
      const [phase] = (await DealPhase.aggregate([
        {
          $match: {
            "tasks._id": new mongoose.Types.ObjectId(req.params.task_id),
          },
        },
        {
          $unwind: {
            path: "$tasks",
          },
        },
        {
          $match: {
            "tasks._id": new mongoose.Types.ObjectId(req.params.task_id),
          },
        },
      ])) as unknown as MungedDealPhase[];

      if (!phase) {
        throw new HttpError(
          `No task with task_id ${req.params.task_id} found`,
          404
        );
      }

      const deal = await Deal.findById(phase.deal_id);

      if (!deal) {
        throw new HttpError(`No deal with deal_id ${phase.deal_id} found`, 404);
      }

      let documentParams: { [key: string]: string | mongoose.Types.ObjectId } =
        {
          deal_id: phase.deal_id,
          task_id: req.params.task_id,
        };

      if (phase.tasks.title === "Upload ID or Passport")
        documentParams = { ...documentParams, user_id: deal.user_id };

      const path = `deal/uploads/${req.params.task_id}`;
      const document = await Document.findOneAndUpdate(
        documentParams,
        {
          path,
          title: req.body.title,
          bucket: process.env.DOCUMENTS_BUCKET,
          content_type: req.body.content_type,
          complete: false,
          status: "pending",
        },
        { new: true, upsert: true }
      );

      const command = new PutObjectCommand({
        Bucket: process.env.DOCUMENTS_BUCKET!,
        Key: path,
      });

      const link = await getSignedUrl(client, command);

      res.send({ document, link });
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })
  .get("/signing-link/:task_id", async (req, res, next) => {
    try {
      const { task_id } = req.params;
      const phase = await DealPhase.findOne({
        "tasks._id": task_id,
      });
      if (!phase) throw new HttpError("No phase found", 404);

      const task = phase.tasks.find(({ _id }) => _id.toString() === task_id);
      if (!task) throw new HttpError("No task found", 404);

      const deal = await Deal.findById(phase.deal_id);
      if (!deal) throw new HttpError("No deal found", 404);

      const createAgreementFn: {
        [key: string]: (
          deal: Deal,
          task: Task,
          preview?: boolean
        ) => Promise<{ download_url: string }>;
      } = {
        "Sign Services Agreement": createServicesAgreement,
        "Sign Investment Advisory Agreement": createAdvisoryAgreement,
        "Sign Order Form": createOrderForm,
      };

      const preview = req.query.preview === "true";

      const { download_url } = await createAgreementFn[task.title](
        deal,
        task,
        preview
      );

      res.json({ agreementLink: download_url });
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })
  .get("/mou-signing-link/:deal_id", async (req, res, next) => {
    try {
      const deal = await Deal.findById(req.params.deal_id);
      if (!deal) throw new HttpError("No deal found", 404);

      const organization = await Organization.findById(deal.organization_id);
      if (!organization)
        throw new HttpError(
          `No organization found with id: ${deal.organization_id}`,
          404
        );

      const preview = req.query.preview === "true";
      let document;

      if (preview) {
        document = await getMemorandumOfUnderstanding(organization);
      } else {
        document = await createMemorandumOfUnderstanding({
          deal,
          organization,
          preview: false,
        });
      }
      res.json({ document, organization });
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  .get("/deal/:deal_id", async (req, res, next) => {
    try {
      const deal = await Deal.findById(req.params.deal_id);

      if (!deal) return res.send([]);

      const documents = (await Document.aggregate([
        {
          $match: {
            $or: [
              { deal_id: new ObjectId(req.params.deal_id) },
              { "metadata.deal_id": new ObjectId(req.params.deal_id) },
              { user_id: new ObjectId(deal.user_id) },
            ],
          },
        },
        {
          $lookup: {
            from: "dealphases",
            localField: "task_id",
            foreignField: "tasks._id",
            as: "tasks",
          },
        },
        {
          $unwind: {
            path: "$tasks",
          },
        },
        {
          $addFields: {
            task: {
              $filter: {
                input: "$tasks.tasks",
                cond: {
                  $eq: ["$$this._id", "$task_id"],
                },
              },
            },
          },
        },
        {
          $unwind: {
            path: "$task",
          },
        },
        {
          $addFields: {
            task_title: "$task.title",
          },
        },
        {
          $unset: ["tasks", "task"],
        },
      ])) as Document[];

      const documentLinks = await Promise.all(
        documents.map(async (document) => {
          const command = new GetObjectCommand({
            Bucket: document.bucket,
            Key: document.path,
          });

          return {
            ...document,
            link: await getSignedUrl(client, command),
          };
        })
      );

      res.send(documentLinks);
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  .get("/:id", async (req, res, next) => {
    try {
      const doc = await Document.findById(req.params.id).lean();
      if (!doc) throw new HttpError("No document found", 404);

      const command = new GetObjectCommand({
        Bucket: doc.bucket,
        Key: doc.path,
      });

      res.send({ ...doc, link: await getSignedUrl(client, command) });
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  .delete("/delete-by-task-id/:task_id", async (req, res, next) => {
    try {
      res.send(await deleteDocumentByTaskId(req.params.task_id));
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })
  .post("/wire-instructions-upload-link/:deal_id", async (req, res, next) => {
    try {
      const { deal_id } = req.params;
      const path = `deal/wire-instructions/${deal_id}`;
      const bucket = process.env.DOCUMENTS_BUCKET!;
      const { content_type, title } = req.body;

      const document = await Document.findOneAndUpdate(
        {
          deal_id,
          title,
        },
        {
          deal_id,
          path,
          title,
          bucket,
          content_type,
          type: "upload",
        },
        { upsert: true, new: true }
      );

      if (!document) {
        throw new Error(
          `Unable to create wire insturctions document for deal: ${deal_id}`
        );
      }

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: path,
      });

      const link = await getSignedUrl(client, command);
      res.send({ link });
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })
  .get("/wire-instructions/:deal_id", async (req, res, next) => {
    try {
      const { deal_id } = req.params;
      const doc = await Document.findOne({
        deal_id,
        title: "Wire Instructions",
      });
      if (!doc || !doc.complete) throw new HttpError("No document found", 404);

      const command = new GetObjectCommand({
        Bucket: doc.bucket,
        Key: doc.path,
      });

      res.send({ link: await getSignedUrl(client, command) });
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })
  .get(
    "/pre-signed-subscription-agreement/:deal_id",
    async (req, res, next) => {
      try {
        const { deal_id } = req.params;
        const doc = await Document.findOne({
          deal_id,
          title: "Presigned Subscription Agreement",
        });
        if (!doc) throw new HttpError("No document found", 404);

        const command = new GetObjectCommand({
          Bucket: doc.bucket,
          Key: doc.path,
        });

        res.send({ link: await getSignedUrl(client, command) });
      } catch (e: any) {
        log.error({ err: e }, e.message);
        next(e);
      }
    }
  )

  .post("/:title/upload-link/:deal_id", async (req, res, next) => {
    try {
      const { deal_id, title } = req.params;
      const path = `deal/${title}/${deal_id}`;
      const bucket = process.env.DOCUMENTS_BUCKET!;
      const { content_type } = req.body;

      const document = await Document.findOneAndUpdate(
        {
          deal_id,
          title,
        },
        {
          deal_id,
          path,
          title,
          bucket,
          content_type,
          type: "upload",
        },
        { upsert: true, new: true }
      );

      if (!document) {
        throw new Error(
          `Unable to create wire instructions document for deal: ${deal_id}`
        );
      }

      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: path,
      });

      const link = await getSignedUrl(client, command);
      res.send({ link });
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  .get("/:title/:deal_id", async (req, res, next) => {
    try {
      const { deal_id, title } = req.params;
      const doc = await Document.findOne({
        deal_id,
        title,
      });
      if (!doc) throw new HttpError("No document found", 404);

      const command = new GetObjectCommand({
        Bucket: doc.bucket,
        Key: doc.path,
      });

      res.send({ link: await getSignedUrl(client, command) });
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  })

  .get("/:deal_id/documents/retool", async (_req, res, next) => {
    try {
      const docspringRes = await new Promise((resolve, reject) => {
        docspring.generatePDF(
          "tpl_sZaF6DnQdyH55Dkyd7",
          {
            editable: false,
            data: {
              message: "HEY",
            },
            data_requests: [
              {
                email: "asdsa@dasd.com",
                auth_type: "email_link",
                auth_session_started_at: new Date(),
                fields: ["signature"],
              },
            ],
            // metadata: {
            //   user_id: 123,
            // },
            wait: true,
          },
          (error: any, response: unknown) => {
            if (error) reject(error);
            else resolve(response);
          }
        );
      });
      docspring.createDataRequestToken(
        // @ts-ignore
        docspringRes.submission.data_requests[0].id,
        // @ts-ignore
        function (error, token) {
          if (error) throw error;
          res.send(token);
        }
      );
    } catch (e: any) {
      log.error({ err: e }, e.message);
      next(e);
    }
  });
