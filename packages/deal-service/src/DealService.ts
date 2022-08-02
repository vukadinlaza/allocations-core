/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { ModifyResult } from "@allocations/service-common";
import fetch from "node-fetch";
import { Deal } from "./Deal";
import { MongoClient, Filter, ObjectId, Collection, Document } from "mongodb";

/**
 * The `DealService` class exposes both instance and static methods for interacting with Investor data.
 * In order to use the static methods both `ALLOCATIONS_DEAL_SERVICE` and `ALLOCATIONS_TOKEN` must be set as environment variables.
 *
 * @example
 *
 * @example
 * ```js
 * const deal = await DealService.create('My Deal');
 * ```
 */

let client: MongoClient | null = null;

export class DealService {
  private client: MongoClient;
  private url: string;
  private token: string;
  private connected: boolean;

  constructor({
    client = new MongoClient(process.env.ALLOCATIONS_DEAL_SERVICE_MONGODB!),
    url = process.env.ALLOCATIONS_DEAL_SERVICE!,
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
      !process.env.ALLOCATIONS_DEAL_SERVICE ||
      !process.env.ALLOCATIONS_DEAL_SERVICE_MONGODB ||
      !process.env.ALLOCATIONS_TOKEN
    ) {
      throw new Error(
        "DealService requires `ALLOCATIONS_DEAL_SERVICE`, `ALLOCATIONS_DEAL_SERVICE_MONGODB`, and `ALLOCATIONS_TOKEN` environment variables"
      );
    }

    if (!client) {
      client = new MongoClient(process.env.ALLOCATIONS_DEAL_SERVICE_MONGODB);
      await client.connect();
    }

    return new DealService({
      client,
      url: process.env.ALLOCATIONS_DEAL_SERVICE!,
      token: process.env.ALLOCATIONS_TOKEN!,
      connected: true,
    });
  }

  private async getCollection(): Promise<Collection<Deal>> {
    if (!this.connected) {
      this.connected = true;
      await this.client.connect();
    }

    return this.client.db().collection("deals");
  }

  private async getDealAggregation(
    query: Filter<Deal>,
    options?: { limit: number; skip: number }
  ): Promise<Deal[]> {
    const deals = await this.getCollection();
    const aggregationQuery: Document[] = [
      { $match: query },
      {
        $lookup: {
          from: "dealphases",
          localField: "_id",
          foreignField: "deal_id",
          as: "phases",
        },
      },
    ];

    if (options?.limit) {
      aggregationQuery.push({ $limit: options.limit });
    }

    if (options?.skip) {
      aggregationQuery.push({ $skip: options.skip });
    }

    return deals
      .aggregate<Deal>([
        { $match: query },
        {
          $lookup: {
            from: "dealphases",
            localField: "_id",
            foreignField: "deal_id",
            as: "phases",
          },
        },
      ])
      .toArray();
  }

  static async create(options: {
    user_id: string;
    type: string;
  }): Promise<ModifyResult> {
    return (await this.instance()).create(options);
  }

  async create(options: {
    user_id: string;
    type: string;
  }): Promise<ModifyResult> {
    const res = await fetch(`${this.url}/create`, {
      method: "POST",
      headers: {
        "X-API-TOKEN": this.token,
      },
      body: JSON.stringify(options),
    });

    return res.json();
  }

  static async setBuildInfo(
    deal_id: string,
    deal: Deal
  ): Promise<ModifyResult> {
    return (await this.instance()).setBuildInfo(deal_id, deal);
  }

  async setBuildInfo(deal_id: string, deal: Deal): Promise<ModifyResult> {
    const res = await fetch(`${this.url}/build/info`, {
      method: "POST",
      headers: {
        "X-API-TOKEN": this.token,
      },
      body: JSON.stringify({ deal_id, deal }),
    });

    return res.json();
  }

  static async get(id: string): Promise<Deal | null> {
    return (await this.instance()).get(id);
  }

  async get(id: string): Promise<Deal | null> {
    const [deal = null] = await this.getDealAggregation({
      _id: new ObjectId(id),
    });
    return deal;
  }
  static async getDealByFundIDAndDealSlug(
    organization_id: string,
    deal_slug: string
  ): Promise<Deal | null> {
    return (await this.instance()).getDealByFundIDAndDealSlug(
      organization_id,
      deal_slug
    );
  }

  async getDealByFundIDAndDealSlug(
    organization_id: string,
    deal_slug: string
  ): Promise<Deal | null> {
    const [deal = null] = await this.getDealAggregation({
      organization_id,
      slug: deal_slug,
    });
    return deal;
  }

  static async uploadDocument(
    doc: Buffer,
    options: {
      deal_id: string;
      phase: string;
      title: string;
      user_id: string;
      task_id: string;
      content_type: string;
    }
  ): Promise<ModifyResult> {
    return (await this.instance()).uploadDocument(doc, options);
  }

  async uploadDocument(
    doc: Buffer,
    options: {
      deal_id: string;
      phase: string;
      title: string;
      user_id: string;
      task_id: string;
      content_type: string;
    }
  ): Promise<ModifyResult> {
    const res = await fetch(`${this.url}/document-upload-link`, {
      method: "POST",
      headers: {
        "X-API-TOKEN": this.token,
      },
      body: JSON.stringify(options),
    });

    const { link, _id } = await res.json();

    await fetch(link, {
      method: "PUT",
      headers: {
        "Content-Length": doc.length.toString(),
      },
      body: doc,
    });

    return { acknowledged: true, _id };
  }

  static async completeReview(options: {
    deal_id: string;
    task_id: string;
    phase: string;
  }): Promise<ModifyResult> {
    return (await this.instance()).completeReview(options);
  }

  async completeReview(options: {
    deal_id: string;
    task_id: string;
    phase: string;
  }): Promise<ModifyResult> {
    const res = await fetch(`${this.url}/${options.phase}/review`, {
      method: "POST",
      headers: {
        "X-API-TOKEN": this.token,
      },
      body: JSON.stringify(options),
    });

    return res.json();
  }

  static async completeAdminTask(options: {
    deal_id: string;
    task_id: string;
    user_id: string;
    phase: string;
    fields: { [key: string]: any };
  }): Promise<ModifyResult> {
    return (await this.instance()).completeAdminTask(options);
  }

  async completeAdminTask(options: {
    deal_id: string;
    task_id: string;
    user_id: string;
    phase: string;
    fields: { [key: string]: any };
  }): Promise<ModifyResult> {
    const res = await fetch(`${this.url}/complete-admin-task`, {
      method: "POST",
      headers: {
        "X-API-TOKEN": this.token,
      },
      body: JSON.stringify(options),
    });

    return res.json();
  }

  static async getServicesAgreementLink(deal_id: string): Promise<{
    id: string;
    token_id: string;
    token_secret: string;
    link: string;
  }> {
    return (await this.instance()).getServicesAgreementLink(deal_id);
  }

  async getServicesAgreementLink(deal_id: string): Promise<{
    id: string;
    token_id: string;
    token_secret: string;
    link: string;
  }> {
    const res = await fetch(`${this.url}/build/agreement/${deal_id}`, {
      method: "GET",
      headers: {
        "X-API-TOKEN": this.token,
      },
    });
    const response = await res.json();
    const { id, secret, data_request_url } = response.token;

    const url = new URL(data_request_url);

    return {
      id: url.pathname.split("/").pop() ?? "",
      token_id: id,
      token_secret: secret,
      link: data_request_url,
    };
  }

  static async createEntity(options: {
    deal_id: string;
    task_id: string;
    user_id: string;
    series_name: string;
    master_series: string;
  }): Promise<ModifyResult> {
    return (await this.instance()).createEntity(options);
  }

  async createEntity(options: {
    deal_id: string;
    task_id: string;
    user_id: string;
    series_name: string;
    master_series: string;
  }): Promise<ModifyResult> {
    const res = await fetch(`${this.url}/entity/create`, {
      method: "POST",
      headers: {
        "X-API-TOKEN": this.token,
      },
      body: JSON.stringify(options),
    });

    return res.json();
  }

  static async getDocumentByTaskId(task_id: string): Promise<Document> {
    return (await this.instance()).getDocumentByTaskId(task_id);
  }

  async getDocumentByTaskId(task_id: string): Promise<Document> {
    const res = await fetch(`${this.url}/get-document/${task_id}`, {
      headers: {
        "X-API-TOKEN": this.token,
      },
    });
    return res.json();
  }
  static async getDocumentByTaskTitle(
    deal_id: string,
    phase: string,
    title: string
  ): Promise<Document> {
    return (await this.instance()).getDocumentByTaskTitle(
      deal_id,
      phase,
      title
    );
  }

  async getDocumentByTaskTitle(
    deal_id: string,
    phase: string,
    title: string
  ): Promise<Document> {
    const res = await fetch(
      `${this.url}/getDocumentByTaskTitle/${deal_id}/${phase}/${title}`,
      {
        headers: {
          "X-API-TOKEN": this.token,
        },
      }
    );
    return res.json();
  }

  static async rejectDocument(options: {
    id: string;
    phase: string;
    user_id: string;
    task_id: string;
  }): Promise<ModifyResult> {
    return (await this.instance()).rejectDocument(options);
  }

  async rejectDocument(options: {
    id: string;
    phase: string;
    user_id: string;
    task_id: string;
  }): Promise<ModifyResult> {
    const res = await fetch(`${this.url}/document/${options.id}/reject`, {
      method: "POST",
      headers: {
        "X-API-TOKEN": this.token,
      },
      body: JSON.stringify(options),
    });

    return res.json();
  }

  static async deleteDocument(options: {
    id: string;
    phase: string;
    user_id: string;
    task_id: string;
  }): Promise<ModifyResult> {
    return (await this.instance()).deleteDocument(options);
  }

  async deleteDocument(options: {
    id: string;
    phase: string;
    user_id: string;
    task_id: string;
  }): Promise<ModifyResult> {
    const res = await fetch(`${this.url}/document/${options.id}/delete`, {
      method: "DELETE",
      headers: {
        "X-API-TOKEN": this.token,
      },
      body: JSON.stringify(options),
    });

    return res.json();
  }

  static async getAllDeals(
    query: Filter<Deal>,
    options?: { limit: number; skip: number }
  ): Promise<Deal[]> {
    return (await this.instance()).getAllDeals(query, options);
  }

  async getAllDeals(
    query: Filter<Deal>,
    options?: { limit: number; skip: number }
  ): Promise<Deal[]> {
    return this.getDealAggregation(query, options);
  }

  static async deleteDealById(deal_id: string): Promise<Deal> {
    return (await this.instance()).deleteDealById(deal_id);
  }

  async deleteDealById(deal_id: string): Promise<Deal> {
    const res = await fetch(`${this.url}/delete-deal-by-id/${deal_id}`, {
      headers: {
        "X-API-TOKEN": this.token,
      },
      method: "delete",
    });
    return res.json();
  }

  static async updateDealById(deal: Deal): Promise<Deal> {
    return (await this.instance()).updateDealById(deal);
  }

  async updateDealById(deal: Deal): Promise<Deal> {
    const res = await fetch(`${this.url}/update-deal-by-id`, {
      headers: {
        "X-API-TOKEN": this.token,
      },
      method: "PUT",
      body: JSON.stringify(deal),
    });
    return res.json();
  }
}
