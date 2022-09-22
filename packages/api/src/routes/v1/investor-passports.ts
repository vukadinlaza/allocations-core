/**
 * @openapi
 * tags:
 *  - name: Investor Passport
 *    description: Allocations Investor Passport
 *  - name: Investor Passport Model
 *    description: <SchemaDefinition schemaRef="#/components/schemas/InvestorPassport" />
 * components:
 *  schemas:
 *    InvestorPassport:
 *      type: object
 *      properties:
 *        _id:
 *          type: string
 *          description: The investor passport's primary key.
 *        id:
 *          type: string
 *          description: A virtual of _id.
 *        customer_id:
 *          type: string
 *          description: The id of the customer associated with the investor passport.
 *        phase:
 *          type: string;
 *          enum: [new, onboarding, kyc, review, rejected, failed, self-accredited]
 *          description: The phase the investor passport is currently in.
 *        name:
 *          type: string
 *          description: The name of the Entity or Individual.
 *        type:
 *          type: string
 *          enum: [Entity, Individual]
 *          description: The type of investor passport.
 *        title:
 *          type: string
 *          description: The title of the individual who represents the Entity.
 *        representative:
 *          type: string
 *          description: The name of the individual who represents the Entity.
 *        country:
 *          type: string
 *          description: The country of formation or residence.
 *        accreditation_type:
 *          type: string
 *          description: How the investor is accredited.
 *        metadata:
 *          type: object
 *          description: Extra data to store with the investor passport.
 */
import { Router } from "express";
import {
  InvestorPassport,
  KYCResult,
  PassportUser,
  TaxInformation,
  PassportAsset,
} from "@allocations/core-models";
import { getFormType } from "../../utils/investor-passports";
import { HttpError } from "@allocations/api-common";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  checkPassportOnboardingStatus,
  completePassportReview,
  initializePassport,
  triggerKYC,
} from "../../services/passports";

const client = new S3Client({ region: "us-east-1" });

export default Router()
  /**
   * @openapi
   * /api/v1/investor-passports:
   *  post:
   *    description: Create a new investor passport.
   *    tags: [Investor Passport]
   *    requestBody:
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            type: object
   *            properties:
   *              name:
   *                type: string
   *                description: The name of the investor passport. Either the Entity's name or the Individual's name.
   *              type:
   *                type: string
   *                enum: [Entity, Individual]
   *                description: Whether the passport is for an Entity or an Individual.
   *              title:
   *                type: string
   *                description: The title of the individual signing on behalf of an Entity.
   *              representative:
   *                type: string
   *                description: The name of the individual signing on behalf of the Entity.
   *              country:
   *                type: string
   *                description: The country of formation or residence.
   *              accreditation_type:
   *                type: string
   *                description: How the investor is accredited.
   *              metadata:
   *                type: object
   *                description: Extra data to store with the investor passport.
   *            required:
   *              - customer_id
   *              - name
   *              - type
   *              - country
   *              - accreditation_type
   *    responses:
   *      200:
   *        description: Investor Passport Created
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/InvestorPassport'
   */
  .post("/", async (req, res, next) => {
    try {
      const passport = await InvestorPassport.create({
        ...req.body,
        phase: "new",
      });

      res.send(passport);

      await initializePassport(passport, req.headers["x-api-token"] as string);
    } catch (e: any) {
      next(e);
    }
  })

  /**
   * @openapi
   * /api/v1/investor-passports/{id}/users:
   *  post:
   *    description: Associate a user with an investor passport
   *    tags: [Investor Passport]
   *    parameters:
   *      - name: id
   *        in: path
   *        description: InvestorPassport ID
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
   *              user_id:
   *                type: string
   *                description: ID of the user to associate with the investor passport.
   *              role:
   *                type: string
   *                enum: [admin]
   *                description: The role giving the user permissions on the investor passport.
   *            required:
   *              - user_id
   *              - role
   *    responses:
   *      200:
   *        description: User connected to Investor Passport.
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              properties:
   *                acknowledged:
   *                  type: boolean
   *                _id:
   *                  type: string
   */
  .post("/:id/users", async (req, res, next) => {
    try {
      const passport = await InvestorPassport.findById(req.params.id);
      if (!passport) {
        throw new HttpError("Passport Not Found", 404);
      }

      const { _id } = await PassportUser.create({
        passport_id: req.params.id,
        ...req.body,
      });

      res.send({ acknowledged: true, _id });

      await checkPassportOnboardingStatus(
        passport,
        req.headers["x-api-token"] as string
      );
    } catch (e: any) {
      next(e);
    }
  })

  /**
   * @openapi
   * /api/v1/investor-passports/{id}/tax-information:
   *  post:
   *    description: Add W8/W9 tax information to an investor passport.
   *    tags: [Investor Passport]
   *    parameters:
   *      - name: id
   *        in: path
   *        description: InvestorPassport ID
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
   *              type:
   *                type: string
   *                enum: [W-9, W-9-E, W-8-BEN, W-8-BEN-E]
   *                description: Tax form type..
   *              tax_id:
   *                type: string
   *                description: SSN or EIN for the tax payer.
   *              tax_form:
   *                type: object
   *                description: Tax form data
   *              signature_packet:
   *                type: object
   *                properties:
   *                  accepted_intent_to_sign:
   *                    type: boolean
   *                    description: The user accepted an intent to electronically sign the agreement.
   *                  accepted_electronic_business:
   *                    type: boolean
   *                    description: The user accepted to do business electronically.
   *                  signer_ip_address:
   *                    type: string
   *                    description: The IP Address of the signer at the time of signing the agreement.
   *                  signer_user_id:
   *                    type: string
   *                    description: The signer Allocations user ID.
   *                  signer_email:
   *                    type: string
   *                    description: The email address of the signer at the time of signing the agreement.
   *                  signature_date:
   *                    type: string
   *                    description: The date the signer signed the agreement.
   *            required:
   *              - type
   *              - tax_id
   *              - tax_form
   *              - signature_packet
   *    responses:
   *      200:
   *        description: Tax form created
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              properties:
   *                acknowledged:
   *                  type: boolean
   *                _id:
   *                  type: string
   */
  .post("/:id/tax-information", async (req, res, next) => {
    try {
      const passport = await InvestorPassport.findById(req.params.id);
      if (!passport) {
        throw new HttpError("Passport Not Found", 404);
      }

      const { _id } = await TaxInformation.create({
        passport_id: req.params.id,
        ...req.body,
      });

      res.send({ acknowledged: true, _id });

      await checkPassportOnboardingStatus(
        passport,
        req.headers["x-api-token"] as string
      );
    } catch (e: any) {
      next(e);
    }
  })

  /**
   * @openapi
   * /api/v1/investor-passports/{id}/upload-link/{type}:
   *  post:
   *    description: Retrieve and link to upload a Passport Asset associated with an Investor Passport.
   *    tags: [Investor Passport]
   *    parameters:
   *      - name: id
   *        in: path
   *        description: InvestorPassport ID
   *        required: true
   *        schema:
   *          type: string
   *      - name: type
   *        in: path
   *        description: Passport Asset type
   *        required: true
   *        schema:
   *          type: string
   *          enum: [tax-form, government-issued-id, proof-of-residence]
   *    requestBody:
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            type: object
   *            properties:
   *              content_type:
   *                type: string
   *                description: Asset content type
   *            required:
   *              - content_type
   *    responses:
   *      200:
   *        description: Passport Asset created.
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              properties:
   *                link:
   *                  type: string
   *                  description: PUT link that can be used to upload asset.
   */
  .post("/:id/upload-link/:type", async (req, res, next) => {
    try {
      const passport = await InvestorPassport.findById(req.params.id);
      if (!passport) {
        throw new HttpError("Passport Not Found", 404);
      }

      const command = new PutObjectCommand({
        Bucket: process.env.DOCUMENTS_BUCKET!,
        Key: `passport/${passport._id}/${req.params.type}`,
        ContentType: req.body.content_type,
      });

      const link = await getSignedUrl(client, command);

      res.send({ link });
    } catch (e: any) {
      next(e);
    }
  })

  /**
   * @openapi
   * /api/v1/investor-passports/{id}/review:
   *  post:
   *    description: Complete the review of an Investor Passport.
   *    tags: [Investor Passport]
   *    parameters:
   *      - name: id
   *        in: path
   *        description: InvestorPassport ID
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
   *              action:
   *                type: string
   *                enum: [KYC, SKIP_KYC, REJECT]
   *                description: |
   *                  Whether the investor passport is approved or rejected.
   *                  * **KYC** - approve the investor passport and send to the kyc phase.
   *                  * **SKIP_KYC** - approve the investor passport and skip the kyc phase.
   *                  * **REJECT** - reject the investor passport.
   *            required:
   *              - content_type
   *    responses:
   *      200:
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              properties:
   *                acknowledged:
   *                  type: boolean
   *                _id:
   *                  type: string
   */
  .post("/:id/review", async (req, res, next) => {
    try {
      res.send(
        await completePassportReview(
          req.params.id,
          req.body.action,
          req.headers["x-api-token"] as string
        )
      );
    } catch (e: any) {
      next(e);
    }
  })

  /**
   * @openapi
   * /api/v1/investor-passports/{id}:
   *  patch:
   *    description: Update an Investor Passport.
   *    tags: [Investor Passport]
   *    parameters:
   *      - name: id
   *        in: path
   *        description: InvestorPassport ID
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
   *              name:
   *                type: string
   *                description: The name of the investor passport. Either the Entity's name or the Individual's name.
   *              type:
   *                type: string
   *                enum: [Entity, Individual]
   *                description: Whether the passport is for an Entity or an Individual.
   *              title:
   *                type: string
   *                description: The title of the individual signing on behalf of an Entity.
   *              representative:
   *                type: string
   *                description: The name of the individual signing on behalf of the Entity.
   *              country:
   *                type: string
   *                description: The country of formation or residence.
   *              accreditation_type:
   *                type: string
   *                description: How the investor is accredited.
   *              metadata:
   *                type: object
   *                description: Extra data to store with the investor passport.
   *    responses:
   *      200:
   *        description: Updated Investor Passport
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/InvestorPassport'
   */
  .patch("/:id", async (req, res, next) => {
    try {
      const updatedPassport = await InvestorPassport.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
      );

      if (!updatedPassport)
        throw new Error(`Unable to update passport with id: ${req.params.id}`);

      res.send(updatedPassport);

      await checkPassportOnboardingStatus(
        updatedPassport,
        req.headers["x-api-token"] as string
      );
    } catch (e: any) {
      next(e);
    }
  })

  /**
   * @openapi
   * /api/v1/investor-passports:
   *  get:
   *    description: Get/filter a list of investor passports.
   *    tags: [Investor Passport]
   *    parameters:
   *      - in: query
   *        name: customer_id
   *        schema:
   *          type: string
   *      - in: query
   *        name: name
   *        schema:
   *          type: string
   *      - in: query
   *        name: phase
   *        schema:
   *          type: string
   *          enum: [new, onboarding, kyc, review, rejected, failed, self-accredited]
   *      - in: query
   *        name: type
   *        schema:
   *          type: string
   *          enum: [Entity, Individual]
   *      - in: query
   *        name: title
   *        schema:
   *          type: string
   *      - in: query
   *        name: representative
   *        schema:
   *          type: string
   *      - in: query
   *        name: country
   *        schema:
   *          type: string
   *      - in: query
   *        name: accreditation_type
   *        schema:
   *          type: string
   *    responses:
   *      200:
   *        content:
   *          application/json:
   *            schema:
   *              type: array
   *              items:
   *                $ref: '#/components/schemas/InvestorPassport'
   */
  .get("/", async (req, res, next) => {
    try {
      const { query } = req;
      res.send(await InvestorPassport.find(query));
    } catch (e: any) {
      next(e);
    }
  })

  /**
   * @openapi
   * /api/v1/investor-passports/{id}:
   *  get:
   *    description: Get an investor passport by id.
   *    tags: [Investor Passport]
   *    parameters:
   *      - name: id
   *        in: path
   *        description: InvestorPassport ID
   *        required: true
   *        schema:
   *          type: string
   *    responses:
   *      200:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/InvestorPassport'
   */
  .get("/:id", async (req, res, next) => {
    try {
      const { id } = req.params;
      res.send(await InvestorPassport.findById(id));
    } catch (e: any) {
      next(e);
    }
  })

  /**
   * @openapi
   * /api/v1/investor-passports/{id}/tax-information:
   *  get:
   *    description: Get W8/W9 tax information for an investor passport.
   *    tags: [Investor Passport]
   *    parameters:
   *      - name: id
   *        in: path
   *        description: InvestorPassport ID
   *        required: true
   *        schema:
   *          type: string
   *    responses:
   *      200:
   *        description: Tax Information
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              properties:
   *                _id:
   *                  type: string
   *                id:
   *                  type: string
   *                passport_id:
   *                  type: string
   *                  description: The associated Investor Passport id.
   *                tax_id:
   *                  type: string
   *                  description: The SSN or EIN used for the tax form.
   *                tax_form
   *                  type: object
   *                  description: Information used to fill out the tax form.
   */
  .get("/:id/tax-information", async (req, res, next) => {
    try {
      const taxInformation = await TaxInformation.findOne({
        passport_id: req.params.id,
      });

      if (!taxInformation) {
        throw new HttpError("Not Found", 404);
      }

      res.send(taxInformation);
    } catch (e: any) {
      next(e);
    }
  })

  /**
   * @openapi
   * /api/v1/investor-passports/{id}/kyc:
   *  get:
   *    summary: Trigger KYC for an investor passport
   *    description: Get an investor passport's latest KYC result or trigger a new one if expired.
   *    tags: [Investor Passport]
   *    parameters:
   *      - name: id
   *        in: path
   *        description: InvestorPassport ID
   *        required: true
   *        schema:
   *          type: string
   *    responses:
   *      200:
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              description: Latest KYC results for the investor passport.
   *              properties:
   *                passport_id:
   *                  type: string
   *                  description: The id of the associated investor passport
   *                passed:
   *                  type: boolean
   *                  description: The result of the KYC.
   */
  .get("/:id/kyc", async (req, res, next) => {
    try {
      const { id } = req.params;
      res.send(
        await triggerKYC(
          { passportId: id, force: req.query.force === "true" },
          req.headers["x-api-token"] as string
        )
      );
    } catch (e: any) {
      next(e);
    }
  })
  .get("/:id/kyc-results", async (req, res, next) => {
    try {
      res.send(await KYCResult.find({ passport_id: req.params.id }));
    } catch (e: any) {
      next(e);
    }
  })

  /**
   * @openapi
   * /api/v1/investor-passports/{id}/complete:
   *  get:
   *    summary: Get all incomplete information for an investor passport
   *    description: Get an array of objects showing the missing model and type.
   *    tags: [Investor Passport]
   *    parameters:
   *      - name: id
   *        in: path
   *        description: InvestorPassport ID
   *        required: true
   *        schema:
   *          type: string
   *    responses:
   *      200:
   *        content:
   *          application/json:
   *            schema:
   *              type: array
   *              items:
   *                type: object
   *                description: Object detailing missing information.
   *                properties:
   *                  model:
   *                    type: string
   *                    description: The model of the missing information ("PassportAsset", "TaxInformation", etc).
   *                  type:
   *                    type: string
   *                    description: The exact kind of information missing ("W-9", "government-issued-id", etc).
   */
  .get("/:id/complete", async (req, res, next) => {
    try {
      const [passport, taxInformation, governmentId] = await Promise.all([
        InvestorPassport.findById(req.params.id),
        TaxInformation.findOne({
          passport_id: req.params.id,
        }),
        PassportAsset.findOne({
          passport_id: req.params.id,
          type: "government-issued-id",
        }),
      ]);

      if (!passport) throw new HttpError("Passport not found", 404);

      const taxFormType = getFormType({
        type: passport.type,
        country: passport.country || "United States",
      });

      const missing = [];

      if (!taxInformation) {
        missing.push({ model: "TaxInformation", type: taxFormType });
      }

      if (!governmentId) {
        missing.push({ model: "PassportAsset", type: "government-issued-id" });
      }
      res.send(missing);
    } catch (e: any) {
      next(e);
    }
  })

  /**
   * @openapi
   * /api/v1/investor-passports/{id}/asset:
   *  get:
   *    description: Get a Passport Asset.
   *    tags: [Investor Passport]
   *    parameters:
   *      - name: id
   *        in: path
   *        description: InvestorPassport ID
   *        required: true
   *        schema:
   *          type: string
   *      - name: type
   *        in: query
   *        description: PassportAsset type.
   *        required: true
   *        schema:
   *          type: string;
   *           enum: [tax-form, government-issued-id, proof-of-residence]
   *    responses:
   *      200:
   *        content:
   *          application/json:
   *            schema:
   *              type: object
   *              description: An object containing the signed url for the asset.
   *              properties:
   *                link:
   *                  type: string
   *                  description: The signed url of the asset.
   */
  .get("/:id/asset", async (req, res, next) => {
    try {
      const { id } = req.params;
      const { type } = req.query;

      if (!type) {
        throw new HttpError("Asset type is required", 400);
      }

      const asset = await PassportAsset.findOne({ passport_id: id, type });
      if (!asset) {
        throw new HttpError("Not Found", 404);
      }

      const command = new GetObjectCommand({
        Bucket: asset.bucket,
        Key: asset.path,
      });

      const link = await getSignedUrl(client, command);

      res.send({ link });
    } catch (e: any) {
      next(e);
    }
  });
