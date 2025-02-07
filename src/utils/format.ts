import formatDuration from 'format-duration';
import type { z } from 'zod';
import type { formattingSchema } from '~/server/schemas';

export const DEFAULT_PRECISION = 6;

const pluralize = (
  value: number,
  plurals: Record<'one' | 'some' | 'many', string>,
) => {
  if (value % 10 === 1 && value % 100 !== 11) {
    return plurals.one;
  } else if (
    value % 10 >= 2 &&
    value % 10 <= 4 &&
    (value % 100 < 10 || value % 100 >= 20)
  ) {
    return plurals.some;
  } else {
    return plurals.many;
  }
};

export const formatScore = (
  score: number,
  formatting: z.infer<typeof formattingSchema>,
) => {
  switch (formatting.type) {
    case 'time':
      return formatDuration(score * 1000, { ms: true }).slice(0, -1);
    case 'regex':
      return formatting.regex
        .replaceAll(/\{.*?\|.*?\|.*?\}/g, (match) => {
          const pluralizers = match.slice(1, -1).split('|');
          return pluralize(score, {
            one: pluralizers[0] ?? '_one_',
            some: pluralizers[1] ?? '_some_',
            many: pluralizers[2] ?? '_many_',
          });
        })
        .replaceAll(
          /%value%/g,
          score.toPrecision(formatting.precision ?? DEFAULT_PRECISION),
        );
  }
};
