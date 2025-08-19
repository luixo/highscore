import type { z } from "zod";

import type { JsonValue } from "~/server/database/database.gen";
import {
  aggregationSchema,
  formattingSchema,
  inputsSchema,
  scoresSchema,
  sortSchema,
} from "~/server/schemas";

const getParser =
  <T extends z.ZodType>(schema: T, defaultValue: z.infer<T>) =>
  (value?: JsonValue): z.infer<T> => {
    if (!value) {
      return defaultValue;
    }
    const parsedValue = schema.safeParse(value);
    if (!parsedValue.success) {
      return defaultValue;
    }
    return parsedValue.data;
  };

export const getAggregation = getParser(aggregationSchema, {
  type: "value",
  key: "value",
  defaultValue: 0,
});
export const getFormatting = getParser(formattingSchema, {
  type: "regex",
  precision: 4,
  regex: "%value%",
});
export const getInputs = getParser(inputsSchema, { values: [] });
export const getScores = getParser(scoresSchema, { values: [] });
export const getSort = getParser(sortSchema, { direction: "asc" });
