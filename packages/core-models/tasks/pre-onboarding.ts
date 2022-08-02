const createSPVPreOnboarding = (
  new_hvp: boolean,
  hasBankingInfo: boolean,
  hasId: boolean
): {
  title: string;
  type: string;
  required?: boolean;
  metadata?: any;
}[] => {
  return [
    ...(!hasId
      ? [
          {
            title: "Upload ID or Passport",
            type: "fm-document-upload",
            metadata: {
              tooltip_title: "ID/Passport Upload",
              tooltip_content: `<ul>
            <li>Ensure the ID/passport is laying flat on the surface</li>
            <li>All corners are clearly visible</li>
            <li>Allow at least 1" around all the edges</li>
            <li>*If passport, include the top and bottom portions</li>
            </ul>`,
            },
          },
        ]
      : []),
    {
      title: "Upload Term Sheet",
      type: "fm-document-upload",
      required: false,
      metadata: {
        tooltip_title: "Upload Term Sheet",
        tooltip_content: `<p>If you would like to proceed without uploading the Term Sheet, your deal setup will not be complete until we recieve the term sheet or instructions to proceeed without it. Please contact <a href="mailto:support@allocations.com" target="_blank" rel="noopener">support@allocations.com</a> for further information.</p>`,
      },
    },
    {
      title: "Upload Portfolio Company Wire Instructions (Optional)",
      type: "fm-document-upload",
      required: false,
    },
    ...(new_hvp
      ? [
          {
            title: "Entity Creation",
            type: "process-street-tasks",
            metadata: {
              template_name: "01. Client Solutions",
              task_name: "Entity Formed",
            },
          },
        ]
      : []),
    // Master Series generation task goes here
    ...(!hasBankingInfo
      ? [
          {
            title: "Bank Account Information",
            type: "fm-info",
          },
        ]
      : []),
    {
      title: "SS4 Form Sent for Signature",
      type: "process-street-tasks",
      metadata: {
        template_name: "01. Client Solutions",
        task_name: "Send SS-4 form to FM",
      },
    },
    {
      title: "EIN Creation",
      type: "process-street-tasks",
      metadata: {
        template_name: "01. Client Solutions",
        task_name: "Apply for EIN",
      },
    },
    {
      title: "Bank Account Creation",
      type: "service",
    },
    {
      title: "Drafting Subscription Documents",
      type: "admin-document-upload",
      required: false,
    },

    {
      title: "Sign Subscription Agreement",
      type: "fm-document-signature-docspring",
      required: false,
    },
  ];
};

const createFundPreOnboarding = (
  hasBankingInfo: boolean
): {
  title: string;
  type: string;
  required?: boolean;
  metadata?: any;
}[] => {
  return [
    {
      title: "Upload Fund Logo",
      type: "fm-document-upload",
      required: false,
    },
    {
      title: "Entity Creation",
      type: "process-street-tasks",
      metadata: {
        template_name: "01. Client Solutions",
        task_name: "Entity Formed",
      },
    },
    ...(!hasBankingInfo
      ? [
          {
            title: "Bank Account Information",
            type: "fm-info",
          },
        ]
      : []),
    {
      title: "Confirm Deal Details",
      type: "process-street-tasks",
      metadata: {
        template_name: "03. Onboarding",
        task_name: "Deal Details",
      },
    },
    {
      title: "SS4 Form Sent for Signature",
      type: "process-street-tasks",
      metadata: {
        template_name: "01. Client Solutions",
        task_name: "Send SS-4 form to FM",
      },
    },
    {
      title: "EIN Creation",
      type: "process-street-tasks",
      metadata: {
        template_name: "01. Client Solutions",
        task_name: "Apply for EIN",
      },
    },
    {
      title: "Bank Account Creation",
      type: "process-street-tasks",
      metadata: {
        template_name: "02.A Bank Account",
        task_name: "Confirm Wire Instruction",
      },
    },
    {
      title: "Drafting Subscription Documents",
      type: "admin-document-upload",
      required: false,
    },
    {
      title: "Sign Subscription Agreement",
      type: "fm-document-signature-docspring",
      required: false,
    },
    {
      title: "Deal Page Creation",
      type: "process-street-tasks",
      metadata: {
        template_name: "03. Onboarding",
        task_name: "Deal Details",
      },
    },
  ];
};

export { createSPVPreOnboarding, createFundPreOnboarding };
