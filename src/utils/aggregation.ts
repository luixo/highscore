import type { z } from 'zod';
import type { aggregationSchema, scoresSchema } from '~/server/schemas';

export const aggregateScore = (
  inputs: z.infer<typeof scoresSchema>,
  aggregation: z.infer<typeof aggregationSchema>,
): number => {
  switch (aggregation.type) {
    case 'value':
      return (
        (inputs.find((input) => input.key === aggregation.key)?.value ??
          aggregation.defaultValue) * (aggregation.weight ?? 1)
      );
    case 'sum':
      return aggregation.values.reduce(
        (acc, sub) => acc + aggregateScore(inputs, sub),
        0,
      );
    case 'difference':
      return aggregation.values
        .slice(1)
        .reduce(
          (acc, sub) => acc - aggregateScore(inputs, sub),
          aggregateScore(inputs, aggregation.values[0]),
        );
    case 'division':
      return aggregation.values
        .slice(1)
        .reduce(
          (acc, sub) => acc / aggregateScore(inputs, sub),
          aggregateScore(inputs, aggregation.values[0]),
        );
  }
};
