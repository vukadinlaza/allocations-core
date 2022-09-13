/**
 * @openapi
 * tags:
 *  - name: Organization Fund Manager
 *    description: KYCed users attached to an organization
 *  - name: Organization Fund Manager Model
 *    description: <SchemaDefinition schemaRef="#/components/schemas/OrganizationFundManager" />
 * components:
 *  schemas:
 *    OrganizationFundManager:
 *      type: object
 *      properties:
 *        _id:
 *          type: string
 *          description: The organization admin's primary key.
 *        id:
 *          type: string
 *          description: A virtual of _id.
 *        passport_id:
 *          type: string
 *          description: The id of the related investor passport.
 *        organization_id:
 *          type: string
 *          description: The id of the related organization.
 *        role:
 *          type: string
 *          enum: [fund-manager]
 *          description: The role the admin has.
 */
import { Router } from "express";
import { OrganizationFundManager } from "@allocations/core-models";

export default Router()
  /**
   * @openapi
   * /api/v2/organization-fund-managers:
   *  post:
   *    description: Link an investor passport to an organization
   *    tags: [Organization Fund Manager]
   *    requestBody:
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            type: object
   *            properties:
   *              passport_id:
   *                type: string
   *                description: The investor passport that should be linked to the organization.
   *              organization_id:
   *                type: string
   *                description: The organization that should be linked to an investor passport.
   *              role:
   *                type: string
   *                enum: [fund-manager]
   *                description: The role the investor passport has with the organization
   *            required:
   *              - passport_id
   *              - organization_id
   *              - role
   *    responses:
   *      200:
   *        description: OrganizationFundManager Created
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/OrganizationFundManager'
   */
  .post("/", async (req, res, next) => {
    try {
      res.send(await OrganizationFundManager.create(req.body));
    } catch (e) {
      next(e);
    }
  })

  /**
   * @openapi
   * /api/v2/organization-fund-managers/{id}:
   *  get:
   *    description: Get an organization admin by id
   *    tags: [Organization Fund Manager]
   *    parameters:
   *      - name: id
   *        in: path
   *        description: OrganizationFundManager ID
   *        required: true
   *        schema:
   *          type: string
   *    responses:
   *      200:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/OrganizationFundManager'
   */
  .get("/:id", async (req, res, next) => {
    try {
      res.send(
        await OrganizationFundManager.findById(req.params.id).populate(
          "organization"
        )
      );
    } catch (e) {
      next(e);
    }
  })

  /**
   * @openapi
   * /api/v2/organization-fund-managers:
   *  get:
   *    description: Get/filter a list of organization admins
   *    tags: [Organization Fund Manager]
   *    parameters:
   *      - in: query
   *        name: passport_id
   *        schema:
   *          type: string
   *      - in: query
   *        name: organization_id
   *        schema:
   *          type: string
   *      - in: query
   *        name: role
   *        schema:
   *          type: string
   *          enum: [fund-manager]
   *    responses:
   *      200:
   *        content:
   *          application/json:
   *            schema:
   *              type: array
   *              items:
   *                $ref: '#/components/schemas/OrganizationFundManager'
   */
  .get("/", async (req, res, next) => {
    try {
      res.send(
        await OrganizationFundManager.find(req.query)
          .populate("organization")
          .populate("passport")
      );
    } catch (e) {
      next(e);
    }
  })

  /**
   * @openapi
   * /api/v2/organization-fund-managers/{id}:
   *  patch:
   *    description: Update an organization admin's role by id
   *    tags: [Organization Fund Manager]
   *    parameters:
   *      - name: id
   *        in: path
   *        description: OrganizationFundManager ID
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
   *              role:
   *                type: string
   *                enum: [fund-manager]
   *                description: The new role the organization admin should have.
   *    responses:
   *      200:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/OrganizationFundManager'
   */
  .patch("/:id", async (req, res, next) => {
    try {
      res.send(
        await OrganizationFundManager.findByIdAndUpdate(
          req.params.id,
          {
            role: req.body.role,
          },
          {
            new: true,
          }
        )
      );
    } catch (e) {
      next(e);
    }
  })

  /**
   * @openapi
   * /api/v2/organization-fund-managers/{id}:
   *  delete:
   *    description: Delete an organization admin by id
   *    tags: [Organization Fund Manager]
   *    parameters:
   *      - name: id
   *        in: path
   *        description: OrganizationFundManager ID
   *        required: true
   *        schema:
   *          type: string
   *    responses:
   *      200:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/OrganizationFundManager'
   */
  .delete("/:id", async (req, res, next) => {
    try {
      res.send(await OrganizationFundManager.findByIdAndDelete(req.params.id));
    } catch (e) {
      next(e);
    }
  });
