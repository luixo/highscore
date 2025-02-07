import type { Prisma } from '@prisma/client';
import { aggregationSchema } from '~/server/schemas';

export const getAggregation = (
  aggregation?: Prisma.GameGetPayload<{}>['aggregation'],
) => {
  if (aggregation === null) {
    return;
  }
  const parsedValue = aggregationSchema.safeParse(aggregation);
  if (!parsedValue.success) {
    return;
  }
  return parsedValue.data;
};
