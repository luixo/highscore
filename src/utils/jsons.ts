import type { Prisma } from '@prisma/client';
import type { z, ZodType } from 'zod';
import {
  aggregationSchema,
  formattingSchema,
  inputsSchema,
  scoresSchema,
  sortSchema,
} from '~/server/schemas';

export const getParser = <T extends ZodType<any, any, any>>(schema: T) => {
  return (value?: Prisma.JsonValue): z.infer<T> => {
    if (!value) {
      return;
    }
    const parsedValue = schema.safeParse(value);
    if (!parsedValue.success) {
      return;
    }
    return parsedValue.data;
  };
};

export const getAggregation = getParser(aggregationSchema);
export const getFormatting = getParser(formattingSchema);
export const getInputs = getParser(inputsSchema);
export const getScores = getParser(scoresSchema);
export const getSort = getParser(sortSchema);
