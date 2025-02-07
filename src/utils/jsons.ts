import type { Prisma } from '@prisma/client';
import type { z, ZodType } from 'zod';
import {
  aggregationSchema,
  formattingSchema,
  inputsSchema,
  scoresSchema,
  sortSchema,
} from '~/server/schemas';

export const getParser = <T extends ZodType<any, any, any>>(
  schema: T,
  defaultValue: z.infer<T>,
) => {
  return (value?: Prisma.JsonValue): z.infer<T> => {
    if (!value) {
      return defaultValue;
    }
    const parsedValue = schema.safeParse(value);
    if (!parsedValue.success) {
      return defaultValue;
    }
    return parsedValue.data;
  };
};

export const getAggregation = getParser(aggregationSchema, {
  type: 'value',
  key: 'value',
  defaultValue: 0,
});
export const getFormatting = getParser(formattingSchema, {
  type: 'regex',
  precision: 4,
  regex: '%value%',
});
export const getInputs = getParser(inputsSchema, []);
export const getScores = getParser(scoresSchema, []);
export const getSort = getParser(sortSchema, { direction: 'asc' });
