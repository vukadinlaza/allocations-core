const createSPVOnboarding = (): {
  title: string;
  type: string;
  required?: boolean;
  metadata?: any;
}[] => [
  {
    title: "Ready to Onboard",
    type: "process-street-tasks",
    metadata: {
      template_name: "03. Onboarding",
      task_name: "Confirm Deal Details with FM with Onboarding Message",
    },
  },
  {
    title: "Deal Onboarding",
    type: "process-street-tasks",
    metadata: {
      template_name: "03. Onboarding",
      task_name: "Onboard Investors or FM Onboarding",
    },
  },
  {
    title: "Onboarding Complete",
    type: "process-street-tasks",
    metadata: {
      template_name: "03. Onboarding",
      task_name: "Signatures & Wires Complete or FM Requested Closing",
    },
  },
  {
    title: "KYC Review Complete",
    type: "process-street-tasks",
    metadata: {
      template_name: "03. Onboarding",
      task_name: "Deal Audit",
    },
  },
];

const createFundOnboarding = (): {
  title: string;
  type: string;
  required?: boolean;
  metadata?: any;
}[] => [
  {
    title: "Ready to Onboard",
    type: "process-street-tasks",
    metadata: {
      template_name: "03. Onboarding",
      task_name: "Confirm Deal Details with FM with Onboarding Message",
    },
  },
  {
    title: "Deal Onboarding",
    type: "process-street-tasks",
    metadata: {
      template_name: "03. Onboarding",
      task_name: "Onboard Investors or FM Onboarding",
    },
  },
  {
    title: "Onboarding Complete",
    type: "process-street-tasks",
    metadata: {
      template_name: "03. Onboarding",
      task_name: "Signatures & Wires Complete or FM Requested Closing",
    },
  },
  {
    title: "KYC Review Complete",
    type: "process-street-tasks",
    metadata: {
      template_name: "03. Onboarding",
      task_name: "Deal Audit",
    },
  },
];

export { createSPVOnboarding, createFundOnboarding };
