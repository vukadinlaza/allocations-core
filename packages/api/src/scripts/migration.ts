import { Deal } from "@allocations/core-models";
import { connectMongoose, endDBConnection } from "@allocations/service-common";
import Airtable from "airtable";
import { MongoClient, ObjectId } from "mongodb";
import moment from "moment";
import { Organization } from "@allocations/core-models";
import fetch from "node-fetch";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import FormData from "form-data";
import jwt from "jsonwebtoken";
import { setupEnvironment } from "@allocations/api-common";

require("dotenv").config();

// update local document folder name to MigrationGroup name in file tree
const filePath = path.join(__dirname, "./migrationDocs/AltTab");

const token =
  process.env.ENV === "production"
    ? jwt.sign(process.env.TOKEN!, process.env.APP_SECRET!)
    : process.env.TOKEN;

const updateInvestmentDocs = async (
  dealName: string,
  email: string,
  investment_id: string
) => {
  const keys = await Promise.all(
    fs.readdirSync(`${filePath}/${dealName}/${email}`).map(async (file) => {
      const buffer = await fs.readFileSync(
        `${filePath}/${dealName}/${email}/${file}`
      );

      const formData = new FormData();
      formData.append("file", buffer, file);
      return fetch(
        `${process.env.INVEST_API!}/api/v1/documents/${investment_id}`,
        {
          method: "POST",
          headers: {
            "X-API-TOKEN": token!,
          },
          body: formData,
        }
      );
    })
  );
  return keys;
};

Airtable.configure({
  endpointUrl: "https://api.airtable.com",
  apiKey: process.env.AIRTABLE_API_KEY,
});

const getBase = async (baseId: string) => {
  return Airtable.base(baseId);
};

const createDeals = async () => {
  await setupEnvironment();
  try {
    await connectMongoose();
    const legacyClient = await new MongoClient(process.env.LEGACY_MONGO_URL!);
    const conn = await legacyClient.connect();
    const legacyDb = await conn.db(process.env.LEGACY_MONGO_DB!);

    // find org to do the migration, needs to exist before running the script
    const org = await Organization.findById("61c9e06c8415376576d451eb");

    if (!org) return;

    const base = await getBase(process.env.AIRTABLE_BASE!);
    const spvTable = await base.table("SPV/Funds");
    const spvRecords = await spvTable.select().all();

    // gets a list of spvs from the fm specified on line 85
    const spvList = spvRecords
      .map((r) => ({ ...r.fields, atId: r.id }))
      // .filter((d) => d)
      .filter((d: any) => {
        return (
          d && d["Fund Manager"] && d["Fund Manager"].includes("Greg Moritz")
        );
      });

    const airtableIds = spvList.map((d) => d.atId);
    const invTable = base.table("Investors");
    const investorRecords = await invTable.select().all();

    // gets a list of investments that correspond to the deals found on line 80
    const investments: any[] = investorRecords
      .map((r) => ({ ...r.fields, atId: r.id }))
      .filter((investor: any) => {
        return airtableIds.includes(investor["SPV/Funds"]?.[0]);
      });

    // removes duplicate investors so that we dont accidentally create two or more users in next step
    const reducedInvestors = investments.reduce((acc: any[], curr) => {
      const matchingEmail = acc.find((item) => item.Email === curr.Email);
      if (!matchingEmail) return [...acc, curr];
      return acc;
    }, []);

    // creates users if they dont exist
    await Promise.all(
      reducedInvestors.map(async (investor) => {
        const matchingUser = await legacyDb.collection("users").findOne({
          email: new RegExp(investor.Email.trim(), "i"),
        });
        if (!matchingUser)
          return legacyDb.collection("users").insertOne({
            email: investor.Email.toLowerCase().trim(),
            first_name: investor?.Name?.split(" ")[0] || "N/A",
            last_name: investor?.Name?.split(" ")[1] || "N/A",
            state: investor.State,
            country: investor.Country,
            signer_full_name: investor["Investing Under"],
          });
      })
    );

    // creates deals
    await Promise.all(
      spvList.map(async (spv: any) => {
        // deletes the deal from the db if it is already there
        await Deal.findOneAndDelete({
          "metadata.migration_airtable_id": spv.atId,
        });

        const closing_date = spv["Date Closed"]
          ? (moment(new Date(spv["Date Closed"])).format(
              "YYYY-MM-DD"
            ) as unknown as Date)
          : (moment().format() as unknown as Date);

        // munge airtable data to match our schema
        const dealParams = {
          accept_crypto: false,
          allocations_accounting_provider: false,
          angels_deal: false,
          asset_type: "Startup",
          carry_fee: spv["Total Carry"]
            ? Number(spv["Total Carry"]?.split("%")[0]) / 100
            : 0,
          closing_date,
          custom_investment_agreement: false,
          deal_multiple: spv["Multiple"].toString(),
          deal_term: "10 years",
          description: " ",
          docspring_template_id: " ",
          management_fee: spv["Management Fee"]
            ? Number(spv["Management Fee"].split("%")[0]) / 100
            : 0,
          memo: " ",
          metadata: {
            // adds airtable id to metadata so we can easily delete later if necessary
            migration_airtable_id: spv.atId,
          },
          minimum_investment: 0,
          name: spv["SPV / Fund"],
          organization_id: new mongoose.Types.ObjectId(org._id),
          organization_name: org.name,
          phase: "closed",
          raised: spv["Total Committed"],
          sign_deadline: closing_date,
          slug: `${spv["SPV / Fund"].split(" ").join("-")}-${Date.now()}`,
          target_raise_goal: spv["Total Committed"],
          type: "migration",
          user_id: new mongoose.Types.ObjectId(),
          user_email: "engineering@allocations.com",
          wire_deadline: closing_date,
        };

        return Deal.create(dealParams);
      })
    );

    await Promise.all(
      investments.map(async (investor) => {
        const user = await legacyDb.collection("users").findOne({
          email: investor.Email.toLowerCase().trim(),
        });

        if (!user) return;

        const deal = await Deal.findOne({
          "metadata.migration_airtable_id": investor["SPV/Funds"][0],
        });

        if (!deal) return;

        // creates an object id to match when the investment was made
        const newId: Buffer = ObjectId.generate(
          moment(deal.sign_deadline).add(1, "day").unix()
        );

        function bufferToHex(buffer: Buffer) {
          return [...new Uint8Array(buffer)]
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
        }

        const isEntity = investor["Investing Under"] != investor["Name"];

        // deletes existing investment with the same airtable id, allows the script to run without having to manually delete data from db
        await fetch(
          `${process.env.INVEST_API}/api/v1/investments/migration/${investor.atId}`,
          {
            method: "DELETE",
            headers: {
              "X-API-TOKEN": token!,
            },
          }
        );

        const investments = {
          _id: new mongoose.Types.ObjectId(bufferToHex(newId)),
          accredited_investor_type: null,
          carry_fee_percent: investor["Carry Fee %"] || null,
          investor_country: investor["Country"] || null,
          investor_email: user.email,
          investor_entity_name: isEntity ? investor["Investing Under"] : null,
          investor_name: investor["Name"],
          investor_state: investor["State"] || null,
          investor_type: isEntity ? "Entity" : "Individual",
          management_fee_percent: investor["Management Fee%"] || null,
          metadata: {
            // adds airtable id to metadata so we can easily delete later if necessary
            migration_airtable_id: investor.atId,
            deal_id: deal._id.toString(),
          },
          phase: "complete",
          submission_data: new Map(),
          total_committed_amount: investor["Committed"] || null,
          transactions: [
            {
              _id: new mongoose.Types.ObjectId(),
              committed_amount: investor["Committed"] || null,
              is_crypto: false,
              treasury_transaction_id: null,
              wired_amount: investor["Received"] || null,
              wired_date: null,
            },
          ],
          user_id: new mongoose.Types.ObjectId(user._id),
        };

        // creates new investment
        const invRes = await fetch(
          `${process.env.INVEST_API!}/api/v1/investments/migration`,
          {
            method: "POST",
            headers: {
              "X-API-TOKEN": token!,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ investments }),
          }
        );
        const inv = await invRes.json();

        if (!inv) return;

        // adds documents from local directory to invest api documents collection and associated to each investment
        await updateInvestmentDocs(deal.name, user.email, inv._id.toString());
        return inv;
      })
    );
    endDBConnection();
    legacyClient.close();
    process.exit(0);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

createDeals();
