import { Router } from "express";
import { ObjectId } from "mongodb";
import { Document } from "@allocations/core-models";
import { S3 } from "aws-sdk";

type File = {
  name: string;
  mimetype: string;
  data: Buffer;
};

const s3 = new S3();

export default Router()
  .post("/:id", async (req, res, next) => {
    try {
      const file = (req?.files?.file as File) || {};
      const newId = new ObjectId();
      const key = `investment/${req.params.id}/${file.name}/${newId}`;
      await Document.create({
        _id: newId,
        investment_id: req.params.id,
        title: file.name,
        bucket: process.env.INVESTMENT_BUCKET,
        path: key,
        content_type: file.mimetype,
        complete: false,
        created_by: null,
      });

      await s3
        .putObject({
          Bucket: process.env.INVESTMENT_BUCKET!,
          Key: key,
          Body: file.data,
        })
        .promise();
      res.send({ acknowledged: true });
    } catch (e) {
      next(e);
    }
  })
  .delete("/:id", async (req, res, next) => {
    try {
      const deletedDocument = await Document.findOneAndDelete({
        _id: req.params.id,
      });

      if (!deletedDocument) {
        throw new Error("No document found");
      }
      res.send({ acknowledged: true });
    } catch (e) {
      next(e);
    }
  });
