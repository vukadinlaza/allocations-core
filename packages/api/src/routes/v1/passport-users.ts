/**
 * @openapi
 * tags:
 *  - name: Passport User
 *    description: Users associated with an investor passport
 *  - name: Passport User Model
 *    description: <SchemaDefinition schemaRef="#/components/schemas/Passport User" />
 * components:
 *  schemas:
 *    PassportUser:
 *      type: object
 *      properties:
 *        _id:
 *          type: string
 *          description: The passport user's primary key.
 *        id:
 *          type: string
 *          description: A virtual of _id.
 *        passport_id:
 *          type: string
 *          description: The ID of the investor passport connected to the user.
 *        user_id:
 *          type: string;
 *          description: The ID of the user connected to the investor passport.
 *        role:
 *          type: string
 *          enum: [admin]
 *          description: The role the user has on the investor passport for permissioning.
 */
import { Router } from "express";
import { PassportUser } from "@allocations/core-models";

export default Router()
  /**
   * @openapi
   * /api/v1/passport-users:
   *  get:
   *    description: Get/filter a list of passport users.
   *    tags: [Passport User]
   *    parameters:
   *      - in: query
   *        name: passport_id
   *        schema:
   *          type: string
   *      - in: query
   *        name: user_id
   *        schema:
   *          type: string
   *      - in: query
   *        name: role
   *        schema:
   *          type: string
   *          enum: [admin]
   *    responses:
   *      200:
   *        content:
   *          application/json:
   *            schema:
   *              type: array
   *              items:
   *                $ref: '#/components/schemas/PassportUser'
   */
  .get("/", async (req, res, next) => {
    try {
      res.send(await PassportUser.find(req.query));
    } catch (e: any) {
      next(e);
    }
  });
