/**
 * @openapi
 * tags:
 *  - name: Organization Moderator
 *    description: Non-KYCed users attached to an organization
 *  - name: Organization Moderator Model
 *    description: <SchemaDefinition schemaRef="#/components/schemas/OrganizationModerator" />
 * components:
 *  schemas:
 *    OrganizationModerator:
 *      type: object
 *      properties:
 *        _id:
 *          type: string
 *          description: The organization moderators's primary key.
 *        id:
 *          type: string
 *          description: A virtual of _id.
 *        user_id:
 *          type: string
 *          description: The id of the related user.
 *        organization_id:
 *          type: string
 *          description: The id of the related organization.
 *        role:
 *          type: string
 *          enum: [read-write]
 *          description: The role the moderator has.
 */
import { OrganizationModerator } from "@allocations/core-models";
import { Router } from "express";

export default Router()
  /**
   * @openapi
   * /api/v2/organization-moderators:
   *  post:
   *    description: Link a user to an organization
   *    tags: [Organization Moderator]
   *    requestBody:
   *      required: true
   *      content:
   *        application/json:
   *          schema:
   *            type: object
   *            properties:
   *              user_id:
   *                type: string
   *                description: The user that should be linked to the organization.
   *              organization_id:
   *                type: string
   *                description: The organization that should be linked to a user.
   *              role:
   *                type: string
   *                enum: [read-write]
   *                description: The role the user has with the organization
   *            required:
   *              - user_id
   *              - organization_id
   *              - role
   *    responses:
   *      200:
   *        description: OrganizationModerator Created
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/OrganizationModerator'
   */
  .post("/", async (req, res, next) => {
    try {
      res.send(await OrganizationModerator.create(req.body));
    } catch (e) {
      next(e);
    }
  })

  /**
   * @openapi
   * /api/v2/organization-moderators/{id}:
   *  get:
   *    description: Get an organization moderator by id
   *    tags: [Organization Moderator]
   *    parameters:
   *      - name: id
   *        in: path
   *        description: OrganizationModerator ID
   *        required: true
   *        schema:
   *          type: string
   *    responses:
   *      200:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/OrganizationModerator'
   */
  .get("/:id", async (req, res, next) => {
    try {
      res.send(
        await OrganizationModerator.findById(req.params.id).populate(
          "organization"
        )
      );
    } catch (e) {
      next(e);
    }
  })

  /**
   * @openapi
   * /api/v2/organization-moderators:
   *  get:
   *    description: Get/filter a list of organization moderators
   *    tags: [Organization Moderator]
   *    parameters:
   *      - in: query
   *        name: user_id
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
   *          enum: [read-write]
   *    responses:
   *      200:
   *        content:
   *          application/json:
   *            schema:
   *              type: array
   *              items:
   *                $ref: '#/components/schemas/OrganizationModerator'
   */
  .get("/", async (req, res, next) => {
    try {
      res.send(
        await OrganizationModerator.find(req.query)
          .populate("organization")
          .populate("fund_manager")
      );
    } catch (e) {
      next(e);
    }
  })

  /**
   * @openapi
   * /api/v2/organization-moderators/{id}:
   *  patch:
   *    description: Update an organization moderator's role by id
   *    tags: [Organization Moderator]
   *    parameters:
   *      - name: id
   *        in: path
   *        description: OrganizationModerator ID
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
   *                enum: [read-write]
   *                description: The new role the organization moderator should have.
   *    responses:
   *      200:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/OrganizationModerator'
   */
  .patch("/:id", async (req, res, next) => {
    try {
      res.send(
        await OrganizationModerator.findByIdAndUpdate(
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
   * /api/v2/organization-moderators/{id}:
   *  delete:
   *    description: Delete an organization moderator by id
   *    tags: [Organization Moderator]
   *    parameters:
   *      - name: id
   *        in: path
   *        description: OrganizationModerator ID
   *        required: true
   *        schema:
   *          type: string
   *    responses:
   *      200:
   *        content:
   *          application/json:
   *            schema:
   *              $ref: '#/components/schemas/OrganizationModerator'
   */
  .delete("/:id", async (req, res, next) => {
    try {
      res.send(await OrganizationModerator.findByIdAndDelete(req.params.id));
    } catch (e) {
      next(e);
    }
  });
