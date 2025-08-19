import type { z } from "zod";

import type { formattingSchema } from "~/server/schemas";

export const DEFAULT_PRECISION = 6;

const pluralize = (
  value: number,
  plurals: Record<"one" | "some" | "many", string>,
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

const durationFormat =
  "DurationFormat" in Intl
    ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
      new (Intl as any).DurationFormat("en", { style: "short" })
    : undefined;

export const formatScore = (
  score: number,
  formatting: z.infer<typeof formattingSchema>,
) => {
  switch (formatting.type) {
    case "time":
      return durationFormat
        ? durationFormat.format({ seconds: Math.floor(score) })
        : `${Math.floor(score)}s`;
    case "regex": {
      const numberFormat = new Intl.NumberFormat("en", {
        maximumFractionDigits: formatting.precision ?? DEFAULT_PRECISION,
      });
      return formatting.regex
        .replaceAll(/\{.*?\|.*?\|.*?\}/g, (match) => {
          const pluralizers = match.slice(1, -1).split("|");
          return pluralize(score, {
            one: pluralizers[0] ?? "_one_",
            some: pluralizers[1] ?? "_some_",
            many: pluralizers[2] ?? "_many_",
          });
        })
        .replaceAll(/%value%/g, numberFormat.format(score));
    }
  }
};
