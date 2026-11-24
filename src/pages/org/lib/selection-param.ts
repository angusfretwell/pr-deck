import { parseAsBoolean, parseAsString } from "nuqs";

export const selectionParams = {
  selectedId: parseAsString,
  previewOpen: parseAsBoolean.withDefault(false),
};

export const selectionUrlKeys = { selectedId: "pr", previewOpen: "preview" };
