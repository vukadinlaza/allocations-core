import { ObjectId } from "mongodb";
import { TaxInformation } from "@allocations/core-models";

const ti = new TaxInformation({
  passport_id: new ObjectId(),
  tax_form_document_id: new ObjectId(),
  tax_form: {
    type: "W-9",
  },
});

console.log(ti.validateSync());
