import { DocspringField } from "@allocations/core-models";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf";
import { TextItem } from "pdfjs-dist/types/src/display/api";
import { PDFDocument, StandardFonts } from "pdf-lib";
pdfjs.GlobalWorkerOptions.workerSrc = `${__dirname}/../../worker.js`;

export type FieldPlacement = {
  x: number;
  y: number;
  page: number;
  name: string;
  type: string;
  width: number;
  height: number;
  required?: boolean;
  displayType?: string;
  checkCharacter?: string;
};

const DOCSPRING_PAGE_X_MULTIPLIER = 4.09;
const DOCSPRING_PAGE_Y_MULTIPLIER = 4.0518;
const DOCSPRING_PAGE_Y_PER_PAGE_MULTIPLIER = 0.42;
const PDF_PAGE_HEIGHT = 792;

export const getFieldPlacement = async (
  url: string,
  fields: DocspringField[],
  strategy: string
) => {
  const allFieldsData: FieldPlacement[] = [];

  if (strategy === "White Fields Injection") {
    const doc = await pdfjs.getDocument(url).promise;
    const pdf = await PDFDocument.load(await doc.getData());
    const font = await pdf.embedFont(StandardFonts.TimesRoman);

    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();

      textContent.items.forEach((item, index) => {
        const textItem = item as TextItem;
        const field = fields.find((field) => {
          const matchesWithBrackets = textItem.str.includes(
            `{{${field.name}}}`
          );
          if (matchesWithBrackets) {
            return true;
          } else {
            const previousItem = textContent.items[index - 1] as TextItem;
            const nextItem = textContent.items[index + 1] as TextItem;
            const matchesWithoutBrackets =
              textItem.str === `${field.name}` &&
              previousItem.str === "{{" &&
              nextItem.str === "}}";
            return matchesWithoutBrackets;
          }
        });

        if (field) {
          const match = textItem.str.match(
            /(?<leading>.*)(?<target>\{\{\w+\}\})(?<trailing>.*)/
          );
          const leadingWidth = font.widthOfTextAtSize(
            match?.groups?.leading || "",
            12
          );
          allFieldsData.push({
            required: "required" in field ? field.required : true,
            displayType: field.displayType || "text",
            checkCharacter: field.checkCharacter || "&#10004;",
            x:
              (textItem.transform[4] + leadingWidth) *
              DOCSPRING_PAGE_X_MULTIPLIER,
            y:
              (PDF_PAGE_HEIGHT - (textItem.transform[5] + textItem.height)) *
                DOCSPRING_PAGE_Y_MULTIPLIER +
              DOCSPRING_PAGE_Y_PER_PAGE_MULTIPLIER * i,
            page: i,
            name: field.name,
            type: field.type,
            width: field.default_placements?.[0]?.width || 600,
            height: field.default_placements?.[0]?.height || 70,
          });
        }
      });
    }
  } else {
    fields.forEach((field) => {
      console.log({ field });
      field?.default_placements?.forEach((placement) =>
        allFieldsData.push({
          required: "required" in field ? field.required : true,
          displayType: field.displayType || "text",
          checkCharacter: field.checkCharacter || "&#10004;",
          x: placement.x,
          y: placement.y,
          page: placement.page,
          name: field.name,
          type: field.type,
          width: placement.width,
          height: placement.height,
        })
      );
    });
  }

  return allFieldsData;
};
