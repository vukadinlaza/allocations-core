/* eslint-disable @typescript-eslint/no-non-null-assertion */
// @ts-nocheck
import { ModifyResult } from "@allocations/service-common";
import fetch from "node-fetch";
import { MongoClient, Filter, ObjectId, Collection } from "mongodb";
import { Investment } from "./Investment";
/**
 * The `InvestmentService` class exposes both instance and static methods for interacting with investments.
 * In order to use the static methods both `ALLOCATIONS_INVESTMENT_SERVICE` and `ALLOCATIONS_TOKEN` must be set as environment variables.
 *
 * @example
 *
 * @example
 * ```js
 * const id = await InvestmentService.updateInvestment('61a3ee64e8ad2c04f1ef8f6f', options);
 * ```
 */

let client: MongoClient | null = null;
export class InvestmentService {
  private client: MongoClient;
  private url: string;
  private token: string;
  private connected: boolean;
  constructor({
    client = new MongoClient(
      process.env.ALLOCATIONS_INVESTMENT_SERVICE_MONGODB!
    ),
    url = process.env.ALLOCATIONS_INVESTMENT_SERVICE!,
    token = process.env.ALLOCATIONS_TOKEN!,
    connected = false,
  }: {
    client?: MongoClient;
    url?: string;
    token?: string;
    connected?: boolean;
  } = {}) {
    this.client = client;
    this.url = url;
    this.token = token;
    this.connected = connected;
  }

  private static async instance() {
    if (
      !process.env.ALLOCATIONS_INVESTMENT_SERVICE ||
      !process.env.ALLOCATIONS_INVESTMENT_SERVICE_MONGODB ||
      !process.env.ALLOCATIONS_TOKEN
    ) {
      throw new Error(
        "InvestmentService requires `ALLOCATIONS_INVESTMENT_SERVICE`, `ALLOCATIONS_INVESTMENT_SERVICE_MONGODB` and `ALLOCATIONS_TOKEN` environment variables"
      );
    }

    if (!client) {
      client = new MongoClient(
        process.env.ALLOCATIONS_INVESTMENT_SERVICE_MONGODB
      );
      await client.connect();
    }

    return new InvestmentService({
      client,
      url: process.env.ALLOCATIONS_INVESTMENT_SERVICE,
      token: process.env.ALLOCATIONS_TOKEN,
      connected: true,
    });
  }

  private async getCollection(): Promise<Collection<Investment>> {
    if (!this.connected) {
      this.connected = true;
      await this.client.connect();
    }

    return this.client.db().collection("investments");
  }

  static async create(investment: Investment): Promise<ModifyResult> {
    return (await this.instance()).create(investment);
  }

  async create(investment: Investment): Promise<ModifyResult> {
    const res = await fetch(`${this.url}/start`, {
      method: "POST",
      headers: {
        "X-API-TOKEN": this.token,
      },
      body: JSON.stringify(investment),
    });

    return res.json();
  }

  static async update(
    investment_id: ObjectId,
    investment: Investment
  ): Promise<ModifyResult> {
    return (await this.instance()).update(investment_id, investment);
  }

  async update(
    investment_id: ObjectId,
    investment: Investment
  ): Promise<ModifyResult> {
    const res = await fetch(`${this.url}/update-investment/${investment_id}`, {
      headers: {
        "X-API-TOKEN": this.token,
      },
      method: "PUT",
      body: JSON.stringify(investment),
    });
    return res.json();
  }

  static async find(
    query: Filter<Investment>,
    options?: { limit: number; skip: number }
  ): Promise<Investment[]> {
    return (await this.instance()).find(query, options);
  }

  async find(
    query: Filter<Investment>,
    options?: { limit: number; skip: number }
  ): Promise<Investment[]> {
    const collection = await this.getCollection();
    return collection.find(query, options).toArray();
  }

  static async get(id: string): Promise<Investment | null> {
    return (await this.instance()).get(id);
  }

  async get(id: string): Promise<Investment | null> {
    const collection = await this.getCollection();
    //@ts-ignore
    return collection.findOne({ _id: new ObjectId(id) });
  }
}
