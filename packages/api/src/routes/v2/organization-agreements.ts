/**
 * @openapi
 * tags:
 *  - name: Organization Agreement
 *    description: Allocations OrganizationAgreements like services agreement, memorandum of understanding, master series LLC agreement
 *  - name: Organization Agreement Model
 *    description: <SchemaDefinition schemaRef="#/components/schemas/OrganizationAgreement" />
 * components:
 *  schemas:
 *    OrganizationAgreement:
 *      type: object
 *      properties:
 *        _id:
 *          type: string
 *          description: The organization agreement's primary key.
 *        id:
 *          type: string
 *          description: A virtual of _id.
 *        title:
 *          type: string
 *          description: The title of the agreement.
 *        organization_id:
 *          type: string;
 *          description: The associated organization's id.
 *        signed:
 *          type: boolean
 *          description: Indicates if the agreement has been signed.
 *        type:
 *          type: string
 *          enum: [services-agreement, memorandum-of-understanding, master-series-llc-agreement]
 *          description: The type of agreement.
 *        md5:
 *          type: string
 *          description: Hash of the stored agreement useful for ensuring the stored file is stored correctly.
 *        s3_bucket:
 *          type: string
 *          description: S3 Bucket where the agreement is stored.
 *        s3_key:
 *          type: string
 *          description: S3 Key where the agreement is stored.
 *        signature_packet:
 *          type: object
 *          description: Used to comply with e-signature laws.
 *          properties:
 *            accepted_intent_to_sign:
 *              type: boolean
 *              description: The user accepted an intent to electronically sign the agreement.
 *            accepted_electronic_business:
 *              type: boolean
 *              description: The user accepted to do business electronically.
 *            signer_ip_address:
 *              type: string
 *              description: The IP Address of the signer at the time of signing the agreement.
 *            signer_user_id:
 *              type: string
 *              description: The signer Allocations user ID.
 *            signer_email:
 *              type: string
 *              description: The email address of the signer at the time of signing the agreement.
 *            signature_date:
 *              type: string
 *              description: The date the signer signed the agreement.
 */
import { Router } from "express";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { OrganizationAgreement } from "@allocations/core-models";
import { HttpError } from "@allocations/api-common";
import { signAgreement } from "../../services/organizations";

const client = new S3Client({ region: "us-east-1" });

export default Router()
  /**
   * @openapi
   * /api/v2/organization-agreements:
   *  get:
   *    description: Get/filter a list of organization agreements
   *    tags: [Organization Agreement]
   *    parameters:
   *      - in: query
   *        name: title
   *        schema:
   *          type: string
   *      - in: query
   *        name: organization_id
   *        schema:
   *          type: string
   *      - in: query
   *        name: type
   *        schema:
   *          type: string
   *          enum: [services-agreement, memorandum-of-understanding, master-series-llc-agreement]
   *      - in: query
   *        name: signed
   *        schema:
   *          type: boolean
   *    responses:
   *      200:
   *        content:
   *          application/json:
   *            schema:
   *              type: array
   *              items:
   *                allOf:
   *                  - $ref: '#/components/schemas/OrganizationAgreement'
   *                  - type: object
   *                    properties:
   *                      link:
   *                        type: string
   *                        description: Link to agreement document.
   */
  .get("/", async (req, res, next) => {
    try {
      const agreements = await OrganizationAgreement.find(req.query).select(
        "+s3_bucket +s3_key"
      );

      const agreementsWithLink = await Promise.all(
        agreements.map(async (agreement) => {
          const agreementJSON = agreement.toJSON();
          const command = new GetObjectCommand({
            Bucket: agreement.s3_bucket,
            Key: agreement.s3_key,
          });

          delete agreementJSON.s3_bucket;
          delete agreementJSON.s3_key;

          return {
            ...agreementJSON,
            link: await getSignedUrl(client, command),
          };
        })
      );

      res.send(agreementsWithLink);
    } catch (e) {
      next(e);
    }
  })

  /**
   * @openapi
   * /api/v2/organization-agreements/{id}/sign:
   *  post:
   *    description: Sign an organization agreement by id
   *    tags: [Organization Agreement]
   *    parameters:
   *      - name: id
   *        in: path
   *        description: Organization ID
   *        required: true
   *        schema:
   *          type: string
   *    requestBody:
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            type: object
   *            properties:
   *              accepted_intent_to_sign:
   *                type: boolean
   *                description: The user accepted an intent to electronically sign the agreement.
   *              accepted_electronic_business:
   *                type: boolean
   *                description: The user accepted to do business electronically.
   *              signer_ip_address:
   *                type: string
   *                description: The IP Address of the signer at the time of signing the agreement.
   *              signer_user_id:
   *                type: string
   *                description: The signer Allocations user ID.
   *              signer_email:
   *                type: string
   *                description: The email address of the signer at the time of signing the agreement.
   *              signature_date:
   *                type: string
   *                description: The date the signer signed the agreement.
   *            required:
   *              - accepted_intent_to_sign
   *              - accepted_electronic_business
   *              - signer_ip_address
   *              - signer_user_id
   *              - signer_email
   *              - signature_date
   *    responses:
   *      200:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/OrganizationAgreement'
   */
  .post("/:id/sign", async (req, res, next) => {
    try {
      const agreement = await OrganizationAgreement.findByIdAndUpdate(
        req.params.id,
        {
          signed: true,
          signature_packet: req.body,
        },
        { new: true }
      );
      if (!agreement) {
        throw new HttpError("Agreement Not Found", 404);
      }

      res.send(agreement);

      await signAgreement(
        agreement.organization_id,
        req.headers["x-api-token"] as string
      );
    } catch (e) {
      next(e);
    }
  });
