import type { DurationFormat as _DurationFormat } from "@formatjs/intl-durationformat";
import type { z } from "zod";

import type { formattingSchema } from "~/server/schemas";
import type { Language } from "~/utils/language";

// see https://github.com/microsoft/TypeScript/issues/60608
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Intl {
    // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
    interface DurationFormatConstructor {
      new (
        ...params: ConstructorParameters<typeof _DurationFormat>
      ): _DurationFormat;
      (
        ...params: ConstructorParameters<typeof _DurationFormat>
      ): _DurationFormat;
    }

    const DurationFormat: DurationFormatConstructor;
  }
}

export const DEFAULT_PRECISION = 6;

/*
Expected format:
1: other
2: one | other
3: one | few | other
4: one | few | many | other
5: one | two | few | many | other
6: zero | one | two | few | many | other
*/
const extractPlurals = (input: string): Record<Intl.LDMLPluralRule, string> => {
  const parts = input.split("|");
  const other = parts.at(-1) || "_?_";
  const many = (parts.length >= 4 ? parts.at(-2) : "") || other;
  const few =
    (parts.length >= 3
      ? parts.length >= 4
        ? parts.at(-2)
        : parts.at(-1)
      : "") || many;
  const two = (parts.length >= 5 ? parts.at(-4) : "") || few;
  const zero = (parts.length >= 6 ? parts.at(0) : "") || other;
  const one = (parts.length >= 6 ? parts[1] : parts[0]) || other;
  return {
    zero: zero,
    one: one,
    two: two,
    few: few,
    many: many,
    other: other,
  };
};

export const formatScore = (
  score: number,
  formatting: z.infer<typeof formattingSchema>,
  { language }: { language: Language },
) => {
  switch (formatting.type) {
    case "time": {
      const duration = Temporal.Duration.from({
        milliseconds: Math.floor(score * 1000)
      }).round({
        relativeTo: Temporal.PlainDate.from(new Date().toISOString().slice(0, 10)), largestUnit: 'year'
      });
      return new Intl.DurationFormat(language, { style: "narrow", fractionalDigits: formatting.precision as 1, seconds: 'narrow', milliseconds: "numeric" }).format(duration);
    }
    case "regex": {
      const numberFormat = new Intl.NumberFormat(language, {
        maximumFractionDigits: formatting.precision ?? DEFAULT_PRECISION,
      });
      const pluralRules = new Intl.PluralRules(language);
      return formatting.regex
        .replaceAll(/\{([^}]+)\}/g, (match) => {
          const plurals = extractPlurals(match.slice(1, -1));
          const pluralMatch = pluralRules.select(Math.floor(score));
          return plurals[pluralMatch];
        })
        .replaceAll(/%value%/g, numberFormat.format(score));
    }
  }
};
