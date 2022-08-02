const createSPVClosing = (): {
  title: string;
  type: string;
  required?: boolean;
  metadata?: any;
}[] => [
  {
    title: "Portfolio Company Wire Info Uploaded",
    type: "process-street-tasks",
    metadata: {
      template_name: "04. Deal Closing",
      task_name: "Confirm Wire instructions received",
    },
  },
  {
    title: "Signed Portfolio Company Docs",
    type: "process-street-tasks",
    metadata: {
      template_name: "04. Deal Closing",
      task_name: "Signed Portfolio Company Docs Received",
    },
  },
  {
    title: "Wire Sent to Portfolio Company",
    type: "process-street-tasks",
    metadata: {
      template_name: "04. Deal Closing",
      task_name: "Confirm wire went out",
    },
  },
  {
    title: "Blue Sky Fees Filed",
    type: "process-street-tasks",
    metadata: {
      template_name: "05. Compliance Reg D + Blue Sky",
      task_name: "File Blue Sky Fees",
    },
  },
  {
    title: "Reg D Filing Complete",
    type: "process-street-tasks",
    metadata: {
      template_name: "05. Compliance Reg D + Blue Sky",
      task_name: "File Reg D Form",
    },
  },
];

const createFundClosing = (): {
  title: string;
  type: string;
  required?: boolean;
  metadata?: any;
}[] => [
  {
    title: "Investor Ledger Reconciliation Complete",
    type: "process-street-checklist",
    metadata: {
      template_name: "04. Deal Closing",
      task_name: "Check that all investors that wired, signed docs",
    },
  },
  {
    title: "Blue Sky Fee Review Complete",
    type: "process-street-tasks",
    metadata: {
      template_name: "04. Deal Closing",
      task_name: "Complete Blue sky fee calculations",
    },
  },
  {
    title: "Reg D Filing Complete",
    type: "process-street-tasks",
    metadata: {
      template_name: "05. Compliance Reg D + Blue Sky",
      task_name: "File Blue Sky Fees",
    },
  },
];

export { createFundClosing, createSPVClosing };
