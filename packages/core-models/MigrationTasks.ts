import mongoose, { Document, Model, Schema, Types } from "mongoose";

interface Task {
  type: string;
  order: number;
  name: string;
  complete: boolean;
  disabled: boolean;
}

export interface MigrationTasks extends Document {
  migration_id: Types.ObjectId;
  tasks: Task[];
}

const TaskSchema = new Schema({
  type: {
    type: String,
    required: true,
  },
  order: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  complete: {
    type: Boolean,
    required: true,
  },
  disabled: {
    type: Boolean,
    required: true,
  },
});

interface MigrationTasksModel extends Model<MigrationTasks> {
  createWithTasks(migration_id: Types.ObjectId): Promise<MigrationTasks>;
}

const MigrationTasksSchema = new Schema(
  {
    migration_id: {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Migration",
      required: true,
    },
    tasks: {
      type: [TaskSchema],
      required: true,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

MigrationTasksSchema.statics.createWithTasks = async function (migration_id) {
  const tasks: Task[] = [
    {
      order: 0,
      type: "fm_task",
      name: "Create Organization",
      disabled: false,
      complete: false,
    },
    {
      order: 1,
      type: "fm_task",
      name: "Complete Onboarding Form",
      disabled: false,
      complete: false,
    },
    {
      order: 2,
      type: "fm_signature",
      name: "Sign Service Agreement",
      disabled: true,
      complete: false,
    },
    {
      order: 3,
      type: "redirect",
      name: "Upload Files",
      disabled: false,
      complete: false,
    },
    {
      order: 4,
      type: "redirect",
      name: "Schedule Free Data Migration",
      disabled: false,
      complete: false,
    },
    {
      order: 5,
      type: "allocations",
      name: "Fund Admin Dashboard Created",
      disabled: false,
      complete: false,
    },
    {
      order: 6,
      type: "allocations",
      name: "Change of Master Complete",
      disabled: false,
      complete: false,
    },
    {
      order: 7,
      type: "allocations",
      name: "Tax Returns Generated",
      disabled: false,
      complete: false,
    },
  ];
  return this.create({ migration_id, tasks });
};

export const MigrationTasks = mongoose.model<
  MigrationTasks,
  MigrationTasksModel
>("MigrationTasks", MigrationTasksSchema);
