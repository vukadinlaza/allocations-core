const { SubscriptionTemplate } = require("@allocations/core-models");
const {
  connectMongoose,
  endDBConnection,
} = require("@allocations/service-common");

require("dotenv").config();

(async function script() {
  try {
    await connectMongoose();
    const template = await SubscriptionTemplate.create({
      name: "Allocations Base Template",
      template_id: "tpl_6FAb57jX4Heqg2AFSc",
      pre_sign_fields: [
        {
          name: "fm_signature",
          type: "signature",
          required: true,
          default: "",
          page: 1,
          x: 100,
          y: 460,
        },
      ],
      investor_fields: [
        {
          name: "investor_first_name",
          type: "string",
          required: true,
          default: "",
          page: 1,
          x: 200,
          y: 400,
        },
        {
          name: "investor_last_name",
          type: "string",
          required: true,
          default: "",
          page: 1,
          x: 200,
          y: 450,
        },
        {
          name: "investor_country",
          type: "string",
          required: true,
          default: "",
          page: 1,
          x: 200,
          y: 500,
        },
        {
          name: "investor_state",
          type: "string",
          required: true,
          default: "",
          page: 1,
          x: 200,
          y: 550,
        },
        {
          name: "investment_amount",
          type: "string",
          required: true,
          default: "",
          page: 1,
          x: 200,
          y: 600,
        },
        {
          name: "investor_type",
          type: "string",
          required: true,
          default: "",
          page: 1,
          x: 200,
          y: 650,
        },
        {
          name: "investor_entity_name",
          type: "string",
          required: true,
          default: "",
          page: 1,
          x: 200,
          y: 700,
        },
      ],
      form_skeleton: {
        investment_amount: {
          type: "string",
          label: "Investment Amount",
          required: true,
          group: "",
          format: "number",
          placeholder: "$1000",
        },
        investor_first_name: {
          type: "string",
          label: "Investor First Name",
          required: true,
          group: "personal_information",
          placeholder: "Enter First Name",
        },
        investor_last_name: {
          type: "string",
          label: "Investor Last Name",
          group: "personal_information",
          required: true,
          placeholder: "Enter Last Name",
        },
        investor_country: {
          type: "select",
          choices: ["Country One", "Country Two", "United States"],
          label: "Country",
          group: "personal_information",
          required: true,
          placeholder: "Select Country",
        },
        investor_state: {
          type: "select",
          choices: ["State One", "State Two"],
          label: "State",
          dependencies: [
            { field: "investor_country", required_value: "United States" },
          ],
          group: "personal_information",
        },
        investor_type: {
          type: "select",
          choices: ["Individual", "Entity"],
          label: "Investory Type",
          group: "personal_information",
        },
        investor_entity_name: {
          type: "string",
          label: "Entity Name",
          dependencies: [{ field: "investor_type", required_value: "Entity" }],
          group: "personal_information",
        },
        accredited_investor_type_individual: {
          type: "select",
          choices: [
            "I have individual/ joint net worth in excess of $1m",
            "I’ve had $$200k+ income in each of the two most recent years",
            "I’ve had $200k+ income in each of the two most recent years",
            "I’ve had $300k+ joint income in each of the two most recent years",
            "My professional certification qualifies certification",
            "I am a director or executive officer of the Fund’s",
            "I am a “knowledgeable employee” of the private",
          ],
          label: "Accredited Investor Type",
          dependencies: [
            { field: "investor_type", required_value: "Individual" },
          ],
          group: "personal_information",
        },
        accredited_investor_type_entity: {
          type: "select",
          choices: [
            "Each equity owner of my entity is an accredited investor",
            "My entity has total assets in excess of $5m",
            "I am a “family office” with $5m+ in assets under management",
            "I am an Investment Advisor",
            "I am an Exempt Investment Adviser",
            "I am a private business development company",
            "I am an investment company or a business development company",
            "I am a Small Business Investment Company",
          ],
          label: "Accredited Investor Type",
          dependencies: [{ field: "investor_type", required_value: "Entity" }],
          group: "personal_information",
        },
        second_signer: {
          type: "boolean",
          label: "Please select if there is a second signer",
          group: "second_signer",
        },
        second_signer_first_name: {
          type: "string",
          label: "First Name",
          group: "second_signer",
          dependencies: [{ field: "second_signer", required_value: true }],
        },
        second_signer_last_name: {
          type: "string",
          label: "Last Name",
          group: "second_signer",
          dependencies: [{ field: "second_signer", required_value: true }],
        },
        second_signer_email: {
          type: "string",
          format: "email",
          label: "Email",
          dependencies: [{ field: "second_signer", required_value: true }],
        },
        investment_agreement: {
          type: "boolean",
          label: "I have read and accept the terms of the investment",
          required: true,
        },
        submit_investment: {
          type: "button",
          label: "Continue",
          format: "submit",
        },
      },
    });

    console.log("Template:", template);
    endDBConnection();
    process.exit(0);
  } catch (err) {
    console.log(`\n=== ERROR! Running Script  \n`, err);
    process.exit(1);
  }
})();
