import mongoose, { Document, Model } from "mongoose";
import { Deal } from "./Deal";
import { createFundClosing, createSPVClosing } from "./tasks/closing";
import { createFundOnboarding, createSPVOnboarding } from "./tasks/onboarding";
import {
  createFundPreOnboarding,
  createSPVPreOnboarding,
} from "./tasks/pre-onboarding";

export interface Task extends Document {
  title: string;
  description: string;
  type: string;
  required: boolean;
  complete: boolean;
  done_by: string;
  metadata: mongoose.Types.Map<{ [key: string]: any }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface DealPhase extends Document {
  name: string;
  deal_id: mongoose.Types.ObjectId;
  tasks: Task[];
}

interface PhaseModel extends Model<DealPhase> {
  createBuild(deal: Deal): DealPhase;
  createPostBuild(deal: Deal): DealPhase;
  createPreOnboarding(deal: Deal, new_hvp: boolean): DealPhase;
  createOnboarding(deal: Deal): DealPhase;
  createClosing(deal: Deal): DealPhase;
  createPostClosing(deal_id: mongoose.Types.ObjectId): DealPhase;
}

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: String,
    type: {
      type: String,
      enum: [
        "fm-info",
        "fm-document-upload",
        "fm-document-signature",
        "fm-document-signature-docspring",
        "fm-review",
        "admin-review",
        "admin-info",
        "admin-document-upload",
        "service",
        "process-street-checklist",
        "process-street-tasks",
      ],
      required: true,
    },
    required: {
      type: Boolean,
      default: true,
    },
    complete: {
      type: Boolean,
      required: true,
      default: false,
    },
    done_by: String,
    metadata: Map,
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

const schema = new mongoose.Schema(
  {
    name: {
      type: String,
      enum: [
        "build",
        "post-build",
        "pre-onboarding",
        "onboarding",
        "closing",
        "post-closing",
      ],
      required: true,
    },
    deal_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Deal",
      required: true,
    },
    tasks: [taskSchema],
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

schema.statics.createBuild = function (deal: Deal) {
  const { _id: deal_id, investor_passport_id } = deal;

  // const advisorIsAllocations =
  //   deal.reporting_adviser === "Sharding Advisers LLC";

  const buildTasks = [
    ...(investor_passport_id
      ? [
          {
            title: "Sign Order Form",
            type: "fm-document-signature",
            metadata: {
              key: "order-form",
            },
          },
        ]
      : [
          {
            title: "Sign Services Agreement",
            type: "fm-document-signature",
            metadata: {
              key: "services-agreement",
            },
          },
        ]),
    // ...(advisorIsAllocations
    //   ? [
    //       {
    //         title: "Sign Investment Advisory Agreement",
    //         type: "fm-document-signature",
    //         metadata: {
    //           key: "investment-advisory-agreement",
    //         },
    //       },
    //     ]
    //   : []),
  ];

  return this.create({
    name: "build",
    deal_id,
    tasks: buildTasks,
  });
};

schema.statics.createPostBuild = function (deal: Deal) {
  const postBuildTasks = [
    {
      title: `Create Process Street Run: 01. Client Solutions${
        deal.type === "fund" ? " (Fund)" : ""
      }`,
      type: "service",
    },
    {
      title: "Confirm Entity Information",
      type: "process-street-tasks",
      metadata: {
        template_name: "01. Client Solutions",
        task_name: "Enter Deal Details",
      },
    },
  ];

  return this.create({
    name: "post-build",
    deal_id: deal._id,
    tasks: postBuildTasks,
  });
};

schema.statics.createPreOnboarding = async function (
  deal: Deal,
  new_hvp: boolean
) {
  const { _id: deal_id } = deal;

  const productMap: {
    [key: string]: {
      title: string;
      type: string;
      required?: boolean;
      metadata?: any;
    }[];
  } = {
    spv: createSPVPreOnboarding(new_hvp),
    fund: createFundPreOnboarding(),
    acquisition: createSPVPreOnboarding(new_hvp),
  };

  return this.create({
    name: "pre-onboarding",
    deal_id,
    tasks: productMap[deal.type],
  });
};

schema.statics.createOnboarding = function (deal: Deal) {
  const productMap: {
    [key: string]: {
      title: string;
      type: string;
      required?: boolean;
      metadata?: any;
    }[];
  } = {
    spv: createSPVOnboarding(),
    acquisition: createSPVOnboarding(),
    fund: createFundOnboarding(),
  };

  return this.create({
    name: "onboarding",
    deal_id: deal._id,
    tasks: productMap[deal.type],
  });
};

schema.statics.createClosing = function (deal: Deal) {
  const { _id: deal_id } = deal;
  const productMap: {
    [key: string]: {
      title: string;
      type: string;
      required?: boolean;
      metadata?: any;
    }[];
  } = {
    spv: createSPVClosing(),
    acquisition: createSPVClosing(),
    fund: createFundClosing(),
  };

  return this.create({
    name: "closing",
    deal_id,
    tasks: productMap[deal.type],
  });
};

schema.statics.createPostClosing = function (deal_id) {
  return this.create({
    name: "post-closing",
    deal_id,
    tasks: [
      {
        title: "User Acknowledged Complete",
        type: "fm-review",
      },
      {
        title: "Compliance EDGAR Submission",
        type: "process-street-checklist",
        metadata: {
          template_name: "05. Compliance EDGAR Submission",
        },
      },
    ],
  });
};

export const DealPhase = mongoose.model<DealPhase, PhaseModel>(
  "DealPhase",
  schema
);
