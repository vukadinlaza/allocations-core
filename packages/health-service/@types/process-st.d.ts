type ProcessStreetUser = {
  id: string;
  email: string;
  username: string;
};

type ProcessStreetFormFields = {
  id: string;
  label: string;
  type: string;
  value: string;
  updatedBy: ProcessStreetUser;
  hidden: boolean;
};

type ProcessStreetAudit = {
  createdBy: ProcessStreetUser;
  createdDate: string;
  updatedBy: ProcessStreetUser;
  updatedDate: string;
};

type ProcessStreetTask = {
  id: string;
  name: string;
  status: "Completed" | "NotCompleted";
  stopped: boolean;
  hidden: boolean;
  taskTemplateGroupId: string;
  updatedDate: string;
  updatedBy: ProcessStreetUser;
  completedBy: ProcessStreetUser;
  completedDate: string;
};

type ProcessStreetTaskSubmission = ProcessStreetTask & {
  checklist: { id: string; name: string };
  formFields: ProcessStreetFormFields[];
};

type ProcessStreetChecklistSubmission = {
  id: string;
  name: string;
  audit: ProcessStreetAudit;
  template: { id: string; name: string };
  formFields: ProcessStreetFormFields;
  tasks: ProcessStreetTask[];
  completedBy: ProcessStreetUser;
  completedDate: string;
};

type ProcessStreetEvent = {
  id: string;
  type: "ChecklistCreated" | "ChecklistCompleted" | "TaskCheckedUnchecked";
  createdDate: string;
  data: ProcessStreetChecklistSubmission | ProcessStreetTaskSubmission;
};
