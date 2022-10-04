import mongoose, { Model, Document as MongooseDocument } from "mongoose";

//These fields are the fields that are going to be shown in the FRONTEND form
export interface InvestorFormField extends MongooseDocument {
  name: string; //name of the field
  component: string; //component type of the field. Supported now are: button, checkbox, input, select, radio, autocomplete and typography
  label?: string; //label or title that describes the field
  required?: boolean; //is this field required to validate before creating the document in the Frontend
  validation_label?: string; //Name of the field that appears when validation fail;
  validator?: {
    // function to add a specific validation for a field
    parameters: string[];
    body: string;
    invalid_msg: string;
  };
  format?: "number" | "email" | "submit";
  grid_columns?: {
    //grid sizes to have control over the layout of the form
    xs?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  placeholder?: string; // just for inputs
  on_click?: {
    //just for buttons
    parameters: string[];
    body: string;
  };
  choices?: string[]; //the options of a select, radio or autocomplete components
  dependencies?: {
    //this field will show in the form only if the dependencies values are met
    field: string;
    required_value: string;
  }[];
  variant?: string; //just for typographies and buttons
  content?: string; //just for typographies
  font_weight?: number; //just for typographies
  font_color?: string; //just for typographies
  full_width?: boolean; //just for typographies
}

//These fields are the ones that are going to be injected in the DOCSPRING document
//NOTE: Some of these fields will have a direct relation with a InvestorFormField and others will need a value setter to create the value for the field
export interface DocspringField extends MongooseDocument {
  name: string; //name of the field
  type: string; //docspring type of the field (string, number, signature, etc...)
  required?: boolean; //the default value is true. If we need a field not to be required we add required: false
  displayType?: string; //this is used only for booleans (they can be displayed as shape, check or string)
  checkCharacter?:
    | "&#10003;"
    | "&#10004;"
    | "&#10006;"
    | "&#10007;"
    | "&#10008;"; //just for booleans that have a check displaytype (could be an X or a check)
  typeface?: string;
  default_placements?: {
    //default docspring file field coordinates
    page: number;
    x: number;
    y: number;
    width: number;
    height: number;
  }[];
  value_setter?: {
    //function that runs some logic to return the value that this docspring field should have
    parameters: string[];
    body: string;
  };
}

export interface SubscriptionTemplate extends MongooseDocument {
  template_id: string;
  name: string; //Template name
  docspring: {
    //The fields to fill the docspring template
    fm_fields: DocspringField[];
    investor_fields: DocspringField[];
  };
  form_structure: {
    //The fields to create the form in the Frontend
    groups: {
      //Each group is a separate section in the form
      title: string;
      popover: {
        // In case we need some explanation about the section
        title: string;
        content: {
          title: string;
          text: string;
        }[];
      };
      fields: InvestorFormField[];
    }[];
    actions: InvestorFormField[]; //these are fields that are going to be at the bottom of the form. The main one is the submit button
    variables: { [key: string]: any }; //these are variables that need to be injected in the json sent to the form, like the array of countries or the minimum investment amount
  };
}

interface SubscriptionTemplateModel extends Model<SubscriptionTemplate> {}

const DocspringFieldSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  required: Boolean,
  displayType: String,
  checkCharacter: {
    type: String,
    enum: ["&#10003;", "&#10004;", "&#10006;", "&#10007;", "&#10008;"],
  },
  default_placements: [
    {
      page: Number,
      x: Number,
      y: Number,
      width: Number,
      height: Number,
    },
  ],
  typeface: String,
  value_setter: {
    type: {
      parameters: [String],
      body: String,
    },
  },
});

const FormFieldSchema = new mongoose.Schema({
  name: {
    required: true,
    type: String,
  },
  component: {
    required: true,
    type: String,
  },
  label: String,
  required: Boolean,
  validation_label: String,
  validator: {
    parameters: [String],
    body: String,
    invalid_msg: String,
  },
  format: {
    type: String,
    enum: ["number", "email", "submit"],
  },
  grid_columns: {
    xs: Number,
    sm: Number,
    md: Number,
    lg: Number,
    xl: Number,
  },
  placeholder: String,
  on_click: {
    parameters: [String],
    body: String,
  },
  choices: [String],
  dependencies: [
    {
      field: String,
      required_value: String,
    },
  ],
  variant: String,
  content: String,
  font_weight: Number,
  font_color: String,
  full_width: Boolean,
});

const schema = new mongoose.Schema<
  SubscriptionTemplate,
  SubscriptionTemplateModel
>(
  {
    template_id: String,
    name: {
      type: String,
      required: true,
    },
    docspring: {
      required: true,
      type: {
        fm_fields: [DocspringFieldSchema],
        investor_fields: [DocspringFieldSchema],
      },
    },
    form_structure: {
      required: true,
      type: {
        groups: {
          title: String,
          popover: {
            title: String,
            content: [{ title: String, text: String }],
          },
          fields: [FormFieldSchema],
        },
        actions: {
          required: true,
          type: [FormFieldSchema],
        },
        variables: Object,
      },
    },
  },
  { timestamps: true }
);

export const SubscriptionTemplate = mongoose.model<
  SubscriptionTemplate,
  SubscriptionTemplateModel
>("SubscriptionTemplate", schema);
